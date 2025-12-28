import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  startAfter,
} from "firebase/firestore";
import { db } from "./firebase";

export const saveWorkoutBatch = async (workoutData) => {
  if (!workoutData || !workoutData.sets || workoutData.sets.length === 0) {
    throw new Error("datos invalidos para guardar entrenamiento");
  }

  const batch = writeBatch(db);
  // fecha simple para agrupar visualmente
  const dateString = workoutData.date || new Date().toISOString().slice(0, 10);
  
  let createdAt;
  if (workoutData.date) {
    createdAt = Timestamp.fromDate(new Date(`${workoutData.date}T12:00:00`));
  } else {
    createdAt = serverTimestamp();
  }

  workoutData.sets.forEach((set) => {
    const docRef = doc(collection(db, "workout_logs"));
    const data = {
      userId: workoutData.userId,
      // conversion obligatoria a minusculas
      muscleGroup: workoutData.muscleGroup.toLowerCase(),
      exercise: workoutData.exercise.toLowerCase(),
      // asegurar guardado de unidad
      unit: workoutData.unit,
      weight: parseFloat(set.weight) || 0,
      reps: parseInt(set.reps, 10) || 0,
      rpe: set.rpe ? parseFloat(set.rpe) : null,
      isWarmup: set.isWarmup,
      isDropSet: set.isDropSet || false,
      setOrder: set.setOrder,
      // calculo estimado de 1rm
      estimated1RM: (parseFloat(set.weight) || 0) * (1 + (parseInt(set.reps, 10) || 0) / 30),
      dateString,
      createdAt,
    };
    batch.set(docRef, data);
  });

  await batch.commit();
};

export const getExerciseStats = async (userId, exerciseName) => {
  const exerciseLower = exerciseName.toLowerCase();
  const collectionRef = collection(db, "workout_logs");

  // consulta a ultima sesion ordenada por fecha
  const lastSessionQuery = query(
    collectionRef,
    where("userId", "==", userId),
    where("exercise", "==", exerciseLower),
    orderBy("dateString", "desc"),
    limit(20) // limite razonable para encontrar la ultima sesion completa
  );

  // para calcular prs correctamente con unidades mixtas kg lb sin campos nuevos
  // necesitamos traer todo el historial del ejercicio y procesarlo en memoria
  const historyQuery = query(
    collectionRef,
    where("userId", "==", userId),
    where("exercise", "==", exerciseLower),
    where("isWarmup", "==", false)
  );

  try {
    const [lastSessionSnap, historySnap] = await Promise.all([
      getDocs(lastSessionQuery),
      getDocs(historyQuery),
    ]);

    // procesar ultima sesion filtrar solo los sets de la fecha mas reciente
    let lastSession = [];
    if (!lastSessionSnap.empty) {
      const latestDate = lastSessionSnap.docs[0].data().dateString;
      lastSession = lastSessionSnap.docs
        .map((d) => ({ ...d.data(), isDropSet: !!d.data().isDropSet }))
        .filter((d) => d.dateString === latestDate);
    }

    // procesar prs en memoria normalizando a kg
    let max1RM = { value: 0, data: null };
    let maxWeight = { value: 0, data: null };

    historySnap.forEach((doc) => {
      const data = doc.data();
      const weight = parseFloat(data.weight) || 0;
      const reps = parseInt(data.reps, 10) || 0;
      const unit = data.unit;

      // normalizar a kg para comparacion
      const weightInKg = unit === 'lb' ? weight * 0.453592 : weight;
      
      // calcular 1rm estimado en kg
      const estimated1RMKg = weightInKg * (1 + reps / 30);

      // actualizar mejor 1rm
      if (estimated1RMKg > max1RM.value) {
        max1RM.value = estimated1RMKg;
        max1RM.data = data;
      }

      // actualizar peso maximo
      if (weightInKg > maxWeight.value) {
        maxWeight.value = weightInKg;
        maxWeight.data = data;
      }
    });

    const pr1rm = max1RM.data
      ? {
          weight: max1RM.data.weight,
          reps: max1RM.data.reps,
          estimated1RM: max1RM.data.estimated1RM,
          unit: max1RM.data.unit,
          dateString: max1RM.data.dateString,
          setOrder: max1RM.data.setOrder,
          rpe: max1RM.data.rpe,
        }
      : null;

    const prWeight = maxWeight.data
      ? {
          weight: maxWeight.data.weight,
          reps: maxWeight.data.reps,
          unit: maxWeight.data.unit,
          dateString: maxWeight.data.dateString,
          setOrder: maxWeight.data.setOrder,
          rpe: maxWeight.data.rpe,
        }
      : null;

    return { lastSession, pr1rm, prWeight };
  } catch (error) {
    console.error("error en getExerciseStats:", error);
    return { lastSession: [], pr1rm: null, prWeight: null };
  }
};

export const getExerciseCatalog = async (userId, muscleGroup) => {
  try {
    const q = query(
      collection(db, "workout_logs"),
      where("userId", "==", userId),
      where("muscleGroup", "==", muscleGroup.toLowerCase())
    );

    const snapshot = await getDocs(q);
    const exercises = snapshot.docs.map((doc) => doc.data().exercise);

    // retornar unicos
    return [...new Set(exercises)];
  } catch (error) {
    console.error("error en getExerciseCatalog:", error);
    return [];
  }
};

export const deleteWorkoutSet = async (setId) => {
  try {
    await deleteDoc(doc(db, "workout_logs", setId));
    return true;
  } catch (error) {
    console.error("Error deleting workout set:", error);
    throw error;
  }
};

export const updateWorkoutSet = async (setId, updatedData) => {
  try {
    const docRef = doc(db, "workout_logs", setId);
    
    // filtrar campos permitidos
    const allowedFields = ['weight', 'reps', 'rpe', 'isWarmup', 'isDropSet', 'unit', 'muscleGroup', 'exercise'];
    const dataToUpdate = {};
    
    Object.keys(updatedData).forEach(key => {
      if (allowedFields.includes(key)) {
        dataToUpdate[key] = updatedData[key];
      }
    });

    // recalcular 1rm si es necesario
    if (dataToUpdate.weight !== undefined || dataToUpdate.reps !== undefined) {
      let weight = dataToUpdate.weight;
      let reps = dataToUpdate.reps;

      if (weight === undefined || reps === undefined) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          if (weight === undefined) weight = currentData.weight;
          if (reps === undefined) reps = currentData.reps;
        }
      }

      const w = parseFloat(weight) || 0;
      const r = parseInt(reps, 10) || 0;
      dataToUpdate.estimated1RM = w * (1 + r / 30);
    }

    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating workout set:", error);
    throw error;
  }
};

export const getWorkoutHistory = async (userId, lastDoc = null, filters = {}) => {
  try {
    const collectionRef = collection(db, "workout_logs");
    const DAYS_TARGET = 5;
    const BATCH_SIZE = 100;
    const MAX_FETCHES = 3;

    let allDocs = [];
    let currentLastDoc = lastDoc;
    let iterations = 0;
    let hasMoreData = true;
    
    let baseConstraints = [
      where("userId", "==", userId)
    ];

    if (filters.date) {
      baseConstraints.push(where("dateString", "==", filters.date));
    }

    if (filters.muscle && filters.muscle !== 'all') {
      baseConstraints.push(where("muscleGroup", "==", filters.muscle));
    }

    if (filters.exercise && filters.exercise !== 'all') {
      baseConstraints.push(where("exercise", "==", filters.exercise));
    }

    baseConstraints.push(orderBy("dateString", "desc"));

    // bucle de fetch
    while (iterations < MAX_FETCHES && hasMoreData) {
      let constraints = [...baseConstraints];

      if (currentLastDoc) {
        constraints.push(startAfter(currentLastDoc));
      }

      constraints.push(limit(BATCH_SIZE));

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        hasMoreData = false;
        break;
      }

      const docs = snapshot.docs;
      allDocs = [...allDocs, ...docs];
      currentLastDoc = docs[docs.length - 1];

      // calcular dias unicos encontrados
      const uniqueDays = new Set(allDocs.map(d => d.data().dateString)).size;

      // si tenemos mas de 5 dias ya es suficiente para garantizar 5 completos
      if (uniqueDays > DAYS_TARGET) {
        break;
      }

      // si el batch vino incompleto es el fin de la coleccion
      if (docs.length < BATCH_SIZE) {
        hasMoreData = false;
      }

      iterations++;
    }

    // agrupar por fecha
    const sessionsMap = {};

    allDocs.forEach((doc) => {
      const data = doc.data();
      const date = data.dateString;

      if (!sessionsMap[date]) {
        sessionsMap[date] = {
          date,
          muscleGroups: new Set(),
          totalVolumeKg: 0,
          totalSets: 0,
          exercises: []
        };
      }

      const session = sessionsMap[date];
      
      // agregar ejercicio a la lista
      session.exercises.push({ id: doc.id, ...data });

      // recolectar grupos musculares
      if (data.muscleGroup) {
        session.muscleGroups.add(data.muscleGroup.toLowerCase());
      }

      // calcular volumen normalizado a kg
      const weight = parseFloat(data.weight) || 0;
      const reps = parseInt(data.reps, 10) || 0;
      const weightInKg = data.unit === 'lb' ? weight * 0.453592 : weight;
      
      session.totalVolumeKg += weightInKg * reps;

      // contar series efectivas no warmup
      if (!data.isWarmup) {
        session.totalSets += 1;
      }
    });

    // transformar map a array y ordenar
    let sessions = Object.values(sessionsMap)
      .map(session => {
        session.exercises.sort((a, b) => a.setOrder - b.setOrder);
        return {
          ...session,
          muscleGroups: Array.from(session.muscleGroups),
          totalVolumeKg: Math.round(session.totalVolumeKg * 100) / 100
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // logica de recorte slicing y cursor
    let nextCursor = null;

    if (sessions.length > DAYS_TARGET) {
      // tomamos solo los primeros 5 dias
      sessions = sessions.slice(0, DAYS_TARGET);
      
      // el cursor debe ser el ultimo documento de la ultima sesion incluida la 5ta
      const lastSessionDate = sessions[sessions.length - 1].date;
      
      // buscamos en alldocs el ultimo doc que corresponda a esa fecha
      // como alldocs mantiene el orden del query desc buscamos el ultimo match
      const lastSessionDocs = allDocs.filter(d => d.data().dateString === lastSessionDate);
      if (lastSessionDocs.length > 0) {
        nextCursor = lastSessionDocs[lastSessionDocs.length - 1];
      }
    } else {
      // si tenemos 5 o menos dias
      if (hasMoreData && allDocs.length > 0) {
        // si aun hay datos en la db el cursor es el ultimo doc que bajamos
        nextCursor = allDocs[allDocs.length - 1];
      } else {
        // si no hay mas datos null
        nextCursor = null;
      }
    }

    return { sessions, lastDoc: nextCursor };

  } catch (error) {
    console.error("Error en getWorkoutHistory:", error);
    if (error.code === 'failed-precondition') {
      console.error("Firestore requiere un índice compuesto para esta consulta. Revisa la consola del navegador para ver el enlace de creación.");
    }
    throw error;
  }
};

export const getMuscleGroups = async (userId) => {
  try {
    const q = query(
      collection(db, "workout_logs"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map((doc) => doc.data().muscleGroup);

    return [...new Set(groups)];
  } catch (error) {
    console.error("error en getMuscleGroups:", error);
    return [];
  }
};

export const getAnalyticsData = async (userId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, "workout_logs"),
      where("userId", "==", userId),
      where("dateString", ">=", startDate),
      where("dateString", "<=", endDate),
      orderBy("dateString", "asc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("error en getAnalyticsData:", error);
    throw error;
  }
};

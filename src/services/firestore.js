import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export const saveWorkoutBatch = async (workoutData) => {
  if (!workoutData || !workoutData.sets || workoutData.sets.length === 0) {
    throw new Error("datos invalidos para guardar entrenamiento");
  }

  const batch = writeBatch(db);
  // fecha simple para agrupar visualmente
  const dateString = new Date().toISOString().slice(0, 10);

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
      setOrder: set.setOrder,
      // calculo estimado de 1rm
      estimated1RM: (parseFloat(set.weight) || 0) * (1 + (parseInt(set.reps, 10) || 0) / 30),
      dateString,
      createdAt: serverTimestamp(),
    };
    batch.set(docRef, data);
  });

  await batch.commit();
};

export const getExerciseStats = async (userId, exerciseName) => {
  const exerciseLower = exerciseName.toLowerCase();
  const collectionRef = collection(db, "workout_logs");

  // consulta a: ultima sesion (ordenada por fecha)
  const lastSessionQuery = query(
    collectionRef,
    where("userId", "==", userId),
    where("exercise", "==", exerciseLower),
    orderBy("dateString", "desc"),
    limit(20) // limite razonable para encontrar la ultima sesion completa
  );

  // consulta b: maximo 1rm historico
  const pr1rmQuery = query(
    collectionRef,
    where("userId", "==", userId),
    where("exercise", "==", exerciseLower),
    where("isWarmup", "==", false), // excluir calentamiento para pr
    orderBy("estimated1RM", "desc"),
    limit(1)
  );

  // consulta c: peso maximo levantado
  const prWeightQuery = query(
    collectionRef,
    where("userId", "==", userId),
    where("exercise", "==", exerciseLower),
    where("isWarmup", "==", false),
    orderBy("weight", "desc"),
    limit(1)
  );

  try {
    const [lastSessionSnap, pr1rmSnap, prWeightSnap] = await Promise.all([
      getDocs(lastSessionQuery),
      getDocs(pr1rmQuery),
      getDocs(prWeightQuery),
    ]);

    // procesar ultima sesion: filtrar solo los sets de la fecha mas reciente
    let lastSession = [];
    if (!lastSessionSnap.empty) {
      const latestDate = lastSessionSnap.docs[0].data().dateString;
      lastSession = lastSessionSnap.docs
        .map((d) => d.data())
        .filter((d) => d.dateString === latestDate);
    }

    const pr1rm = pr1rmSnap.empty ? null : pr1rmSnap.docs[0].data();
    const prWeight = prWeightSnap.empty ? null : prWeightSnap.docs[0].data();

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

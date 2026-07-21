import { collection, addDoc, serverTimestamp, getDocs, writeBatch, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// funcion para guardar una nueva sesion de cardio en la base de datos
export const guardarSesionCardio = async (datosCardio) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    
    const datosFormateados = {
      userId: datosCardio.userId,
      tipo: datosCardio.tipo.toLowerCase(),
      nombre: datosCardio.nombre.toLowerCase(),
      duracionSegundos: datosCardio.duracionSegundos,
      distancia: datosCardio.distancia,
      unidadDistancia: datosCardio.unidadDistancia.toLowerCase(),
      cantidadUnidadRitmo: datosCardio.cantidadUnidadRitmo,
      nombreUnidadRitmo: datosCardio.nombreUnidadRitmo.toLowerCase(),
      segundosRitmo: datosCardio.segundosRitmo,
      velocidadKmh: datosCardio.velocidadKmh,
      fechaString: datosCardio.fechaString,
      createdAt: serverTimestamp(),
      frecuenciaCardiacaPromedio: datosCardio.frecuenciaCardiacaPromedio || null
    };

    const nuevoDocumento = await addDoc(referenciaColeccion, datosFormateados);
    return nuevoDocumento.id;
  } catch (error) {
    console.error("error al guardar sesion de cardio", error);
    throw error;
  }
};

// Actualizar la fecha de todas las sesiones de cardio de una fecha para un usuario
export const bulkUpdateCardioSessionDate = async (userId, oldDate, newDate) => {
  if (!userId || !oldDate || !newDate || oldDate === newDate) return;

  const batch = writeBatch(db);
  const logsRef = collection(db, "cardio_logs");
  const q = query(logsRef, where("userId", "==", userId), where("fechaString", "==", oldDate));
  
  const snapshot = await getDocs(q);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { fechaString: newDate });
  });

  await batch.commit();
};

// Eliminar todas las sesiones de cardio de una fecha para un usuario
export const bulkDeleteCardioSession = async (userId, date) => {
  if (!userId || !date) return;

  const batch = writeBatch(db);
  const logsRef = collection(db, "cardio_logs");
  const q = query(logsRef, where("userId", "==", userId), where("fechaString", "==", date));
  
  const snapshot = await getDocs(q);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
};

// Actualizar una sesion de cardio especifica
export const actualizarSesionCardio = async (cardioId, datosCardio) => {
  try {
    const docRef = doc(db, "cardio_logs", cardioId);
    const datosFormateados = {
      tipo: datosCardio.tipo.toLowerCase(),
      nombre: datosCardio.nombre.toLowerCase(),
      duracionSegundos: datosCardio.duracionSegundos,
      distancia: datosCardio.distancia,
      unidadDistancia: datosCardio.unidadDistancia.toLowerCase(),
      cantidadUnidadRitmo: datosCardio.cantidadUnidadRitmo,
      nombreUnidadRitmo: datosCardio.nombreUnidadRitmo.toLowerCase(),
      segundosRitmo: datosCardio.segundosRitmo,
      velocidadKmh: datosCardio.velocidadKmh,
      frecuenciaCardiacaPromedio: datosCardio.frecuenciaCardiacaPromedio || null
    };
    await updateDoc(docRef, datosFormateados);
    return true;
  } catch (error) {
    console.error("error al actualizar sesion de cardio", error);
    throw error;
  }
};

// Eliminar una sesion de cardio especifica
export const eliminarSesionCardio = async (cardioId) => {
  try {
    const docRef = doc(db, "cardio_logs", cardioId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("error al eliminar sesion de cardio", error);
    throw error;
  }
};
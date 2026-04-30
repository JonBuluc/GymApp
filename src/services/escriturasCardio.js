import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";

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
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

// funcion para obtener el historial de cardio de una fecha especifica
export const obtenerHistorialCardio = async (userId, fecha) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const consultaHistorial = query(
      referenciaColeccion,
      where("userId", "==", userId),
      where("fechaString", "==", fecha),
      orderBy("createdAt", "desc")
    );

    const resultadosConsulta = await getDocs(consultaHistorial);
    const historialCardio = resultadosConsulta.docs.map((documento) => ({
      id: documento.id,
      ...documento.data()
    }));

    return historialCardio;
  } catch (error) {
    console.error("error al obtener historial de cardio", error);
    throw error;
  }
};

// funcion para obtener los records historicos de un cardio especifico
export const obtenerRecordsCardio = async (userId, tipoCardio, nombreCardio) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const tipoFormateado = tipoCardio.toLowerCase();
    const nombreFormateado = nombreCardio.toLowerCase();
    
    const consultaRecords = query(
      referenciaColeccion,
      where("userId", "==", userId),
      where("tipo", "==", tipoFormateado),
      where("nombre", "==", nombreFormateado)
    );

    const resultadosConsulta = await getDocs(consultaRecords);
    
    let recordDistancia = null;
    let recordVelocidad = null;
    let sesionReciente = null;
    
    let distanciaMaximaEncontrada = 0;
    let velocidadMaximaEncontrada = 0;
    let fechaMasRecienteEncontrada = "";

    resultadosConsulta.forEach((documento) => {
      const datosDocumento = documento.data();
      
      const distanciaActual = datosDocumento.distancia || 0;
      const velocidadActual = datosDocumento.velocidadKmh || 0;
      const fechaActual = datosDocumento.fechaString || "";

      // evaluamos record de distancia
      if (distanciaActual > distanciaMaximaEncontrada) {
        distanciaMaximaEncontrada = distanciaActual;
        recordDistancia = { id: documento.id, ...datosDocumento };
      }

      // evaluamos record de velocidad
      if (velocidadActual > velocidadMaximaEncontrada) {
        velocidadMaximaEncontrada = velocidadActual;
        recordVelocidad = { id: documento.id, ...datosDocumento };
      }
      
      // evaluamos sesion reciente
      if (fechaActual > fechaMasRecienteEncontrada) {
        fechaMasRecienteEncontrada = fechaActual;
        sesionReciente = { id: documento.id, ...datosDocumento };
      } else if (fechaActual === fechaMasRecienteEncontrada) {
        // si es el mismo dia exacto, desempatamos usando el registro que se guardó al último
        const tiempoActual = datosDocumento.createdAt?.seconds || 0;
        const tiempoGuardado = sesionReciente?.createdAt?.seconds || 0;
        if (tiempoActual > tiempoGuardado) {
          sesionReciente = { id: documento.id, ...datosDocumento };
        }
      }
    });

    return {
      recordDistancia,
      recordVelocidad,
      sesionReciente
    };
  } catch (error) {
    console.error("error al obtener records de cardio", error);
    throw error;
  }
};

// funcion para obtener los tipos de cardio unicos registrados
export const obtenerTiposCardio = async (userId) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const consulta = query(referenciaColeccion, where("userId", "==", userId));
    const resultados = await getDocs(consulta);
    const tipos = resultados.docs.map((doc) => doc.data().tipo);
    return [...new Set(tipos)].filter(Boolean);
  } catch (error) {
    console.error("error al obtener tipos de cardio", error);
    return [];
  }
};

// funcion para obtener los nombres unicos de un tipo de cardio
export const obtenerNombresCardio = async (userId, tipo) => {
  if (!tipo) return [];
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const tipoFormateado = tipo.toLowerCase();
    const consulta = query(referenciaColeccion, where("userId", "==", userId), where("tipo", "==", tipoFormateado));
    const resultados = await getDocs(consulta);
    const nombres = resultados.docs.map((doc) => doc.data().nombre);
    return [...new Set(nombres)].filter(Boolean);
  } catch (error) {
    console.error("error al obtener nombres de cardio", error);
    return [];
  }
};

// funcion para obtener todo el historial de cardio
export const obtenerTodoHistorialCardio = async (userId) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const consulta = query(referenciaColeccion, where("userId", "==", userId));
    const resultados = await getDocs(consulta);
    
    const historial = resultados.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // ordenamos en memoria por fecha desc
    historial.sort((a, b) => {
      if (a.fechaString !== b.fechaString) {
        return (b.fechaString || "").localeCompare(a.fechaString || "");
      }
      const tiempoA = a.createdAt?.seconds || 0;
      const tiempoB = b.createdAt?.seconds || 0;
      return tiempoB - tiempoA;
    });
    
    return historial;
  } catch (error) {
    console.error("error al obtener todo el historial de cardio", error);
    return [];
  }
};

// funcion para obtener analiticas mensuales de cardio
export const obtenerAnaliticasCardio = async (userId, fechaInicio, fechaFin) => {
  try {
    const referenciaColeccion = collection(db, "cardio_logs");
    const consultaAnaliticas = query(
      referenciaColeccion,
      where("userId", "==", userId),
      where("fechaString", ">=", fechaInicio),
      where("fechaString", "<=", fechaFin),
      orderBy("fechaString", "asc")
    );
    const resultadosConsulta = await getDocs(consultaAnaliticas);
    return resultadosConsulta.docs.map((documento) => ({ id: documento.id, ...documento.data() }));
  } catch (errorAnaliticas) {
    console.error("error al obtener analiticas de cardio", errorAnaliticas);
    throw errorAnaliticas;
  }
};
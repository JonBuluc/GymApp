// funcion auxiliar para calcular distancia entre dos coordenadas usando la formula de haversine
const calcularDistanciaHaversine = (latUno, lonUno, latDos, lonDos) => {
  const radioTierraKm = 6371; // radio de la tierra en kilometros
  const dLat = (latDos - latUno) * (Math.PI / 180);
  const dLon = (lonDos - lonUno) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latUno * (Math.PI / 180)) * Math.cos(latDos * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = radioTierraKm * c;
  return distancia;
};

// funcion principal para procesar un archivo gpx y extraer metricas
export const procesarArchivoGpx = (archivoGpx) => {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onload = (evento) => {
      try {
        const textoGpx = evento.target.result;
        const analizador = new DOMParser();
        const documentoXml = analizador.parseFromString(textoGpx, "application/xml");

        // checar si hubo un error de parseo en el xml
        if (documentoXml.getElementsByTagName("parsererror").length > 0) {
          throw new Error("error de parseo de xml");
        }

        const nombreNodo = documentoXml.querySelector("trk > name");
        const nombreEntrenamiento = nombreNodo ? nombreNodo.textContent : null;

        const puntosTrk = Array.from(documentoXml.getElementsByTagName("trkpt"));
        if (puntosTrk.length < 2) {
          throw new Error("el archivo gpx no contiene suficientes puntos de seguimiento");
        }

        // calculo de duracion
        const tiempoInicio = new Date(puntosTrk[0].querySelector("time").textContent);
        const tiempoFin = new Date(puntosTrk[puntosTrk.length - 1].querySelector("time").textContent);
        const duracionSegundos = Math.round((tiempoFin - tiempoInicio) / 1000);
        const fechaString = new Date(tiempoInicio.getTime() - (tiempoInicio.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        // calculo de distancia y frecuencia cardiaca
        let distanciaKm = 0;
        let sumaFrecuenciaCardiaca = 0;
        let contadorPuntosConFc = 0;

        for (let i = 1; i < puntosTrk.length; i++) {
          const puntoAnterior = puntosTrk[i - 1];
          const puntoActual = puntosTrk[i];

          const latUno = parseFloat(puntoAnterior.getAttribute("lat"));
          const lonUno = parseFloat(puntoAnterior.getAttribute("lon"));
          const latDos = parseFloat(puntoActual.getAttribute("lat"));
          const lonDos = parseFloat(puntoActual.getAttribute("lon"));

          distanciaKm += calcularDistanciaHaversine(latUno, lonUno, latDos, lonDos);

          // buscar frecuencia cardiaca con namespace
          const nodoFc = puntoActual.querySelector("extensions")?.querySelector("hr, gpxtpx\\:hr");
          if (nodoFc) {
            const valorFc = parseInt(nodoFc.textContent, 10);
            if (!isNaN(valorFc)) {
              sumaFrecuenciaCardiaca += valorFc;
              contadorPuntosConFc++;
            }
          }
        }

        const promedioFrecuenciaCardiaca = contadorPuntosConFc > 0 ? sumaFrecuenciaCardiaca / contadorPuntosConFc : null;

        resolve({ duracionSegundos, distanciaKm, promedioFrecuenciaCardiaca, fechaString, nombreEntrenamiento });
      } catch (errorProceso) {
        console.error("error procesando el archivo gpx:", errorProceso);
        reject(errorProceso);
      }
    };

    lector.onerror = (error) => reject(error);
    lector.readAsText(archivoGpx);
  });
};
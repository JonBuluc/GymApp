import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import DatePicker from '../ui/DatePicker';
import Combobox from '../ui/Combobox';
import { guardarSesionCardio } from '../../services/escriturasCardio';
import { obtenerTiposCardio, obtenerNombresCardio } from '../../services/lecturasCardio';
import { procesarArchivoGpx } from '../../utils/gpxParser';

const CardioRecorder = ({ fechaSeleccionada, funcionCambiarFecha, funcionRecargar, tipoActivo, funcionCambiarTipo, nombreActivo, funcionCambiarNombre }) => {
  const { user } = useAuth();
  const [cantidadHoras, cambiarCantidadHoras] = useState('');
  const [cantidadMinutos, cambiarCantidadMinutos] = useState('');
  const [cantidadSegundos, cambiarCantidadSegundos] = useState('');
  const [valorDistancia, cambiarValorDistancia] = useState('');
  const [unidadDistancia, cambiarUnidadDistancia] = useState('km');
  const [cantidadBaseRitmo, cambiarCantidadBaseRitmo] = useState(1);
  const [unidadBaseRitmo, cambiarUnidadBaseRitmo] = useState('km');

  const [tiposDisponibles, cambiarTiposDisponibles] = useState([]);
  const [nombresDisponibles, cambiarNombresDisponibles] = useState([]);

  // estados para importacion gpx
  const [procesandoGpx, setProcesandoGpx] = useState(false);
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState(null);
  const referenciaInputArchivo = useRef(null);

  // cargar tipos de cardio historicos
  useEffect(() => {
    const cargarTipos = async () => {
      if (user) {
        const tipos = await obtenerTiposCardio(user.uid);
        cambiarTiposDisponibles(tipos);
      }
    };
    cargarTipos();
  }, [user]);

  // cargar nombres historicos basados en el tipo
  useEffect(() => {
    const cargarNombres = async () => {
      if (user && tipoActivo) {
        const nombres = await obtenerNombresCardio(user.uid, tipoActivo);
        cambiarNombresDisponibles(nombres);
      } else {
        cambiarNombresDisponibles([]);
      }
    };
    cargarNombres();
  }, [user, tipoActivo]);

  // calculos seguros de velocidad y ritmo
  const horasValidas = parseInt(cantidadHoras, 10) || 0;
  const minutosValidos = parseInt(cantidadMinutos, 10) || 0;
  const segundosValidos = parseInt(cantidadSegundos, 10) || 0;
  const tiempoTotalSegundos = (horasValidas * 3600) + (minutosValidos * 60) + segundosValidos;

  const distanciaValida = parseFloat(valorDistancia) || 0;
  const distanciaEnKm = unidadDistancia === 'km' ? distanciaValida : distanciaValida / 1000;

  let velocidadCalculada = 0;
  if (tiempoTotalSegundos > 0 && distanciaEnKm > 0) {
    velocidadCalculada = (distanciaEnKm / tiempoTotalSegundos) * 3600;
  }

  let segundosRitmoCalculado = 0;
  if (distanciaEnKm > 0 && tiempoTotalSegundos > 0) {
    const baseValida = parseFloat(cantidadBaseRitmo) || 1;
    const objetivoEnKm = unidadBaseRitmo === 'km' ? baseValida : baseValida / 1000;
    segundosRitmoCalculado = (objetivoEnKm / distanciaEnKm) * tiempoTotalSegundos;
  }

  const formatearTiempo = (totalSegundos) => {
    if (!totalSegundos || totalSegundos === Infinity || isNaN(totalSegundos)) return "00:00";
    const horasExtraidas = Math.floor(totalSegundos / 3600);
    const minutosExtraidos = Math.floor((totalSegundos % 3600) / 60);
    const segundosExtraidos = Math.floor(totalSegundos % 60);
    if (horasExtraidas > 0) {
      return `${horasExtraidas}:${minutosExtraidos.toString().padStart(2, '0')}:${segundosExtraidos.toString().padStart(2, '0')}`;
    }
    return `${minutosExtraidos.toString().padStart(2, '0')}:${segundosExtraidos.toString().padStart(2, '0')}`;
  };

  const manejarGuardado = async () => {
    if (!tipoActivo || !nombreActivo) {
      alert("por favor selecciona un tipo y nombre de cardio.");
      return;
    }
    if (!user || distanciaValida <= 0 || tiempoTotalSegundos <= 0) return;
    try {
      const datosNuevos = {
        userId: user.uid,
        tipo: tipoActivo,
        nombre: nombreActivo,
        duracionSegundos: tiempoTotalSegundos,
        distancia: distanciaValida,
        unidadDistancia: unidadDistancia,
        cantidadUnidadRitmo: parseFloat(cantidadBaseRitmo) || 1,
        nombreUnidadRitmo: unidadBaseRitmo,
        segundosRitmo: segundosRitmoCalculado,
        velocidadKmh: velocidadCalculada,
        fechaString: fechaSeleccionada,
        frecuenciaCardiacaPromedio: frecuenciaCardiaca
      };
      await guardarSesionCardio(datosNuevos);
      cambiarCantidadHoras('');
      cambiarCantidadMinutos('');
      cambiarCantidadSegundos('');
      cambiarValorDistancia('');
      setFrecuenciaCardiaca(null);
      funcionCambiarNombre('');
      funcionRecargar();
    } catch (errorGuardado) {
      console.error("error al guardar cardio", errorGuardado);
    }
  };

  const manejarCambioArchivo = async (evento) => {
    const archivos = evento.target.files;
    if (!archivos || archivos.length === 0) return;

    // logica para un solo archivo (preview)
    if (archivos.length === 1) {
      const archivo = archivos[0];
      setProcesandoGpx(true);
      setFrecuenciaCardiaca(null);
      try {
        const metricas = await procesarArchivoGpx(archivo);
        
        cambiarValorDistancia(metricas.distanciaKm.toFixed(2));
        cambiarUnidadDistancia('km');

        const horas = Math.floor(metricas.duracionSegundos / 3600);
        const minutos = Math.floor((metricas.duracionSegundos % 3600) / 60);
        const segundos = metricas.duracionSegundos % 60;
        cambiarCantidadHoras(horas > 0 ? horas.toString() : '');
        cambiarCantidadMinutos(minutos > 0 ? minutos.toString() : '');
        cambiarCantidadSegundos(segundos > 0 ? segundos.toString() : '');

        if (metricas.promedioFrecuenciaCardiaca) {
          setFrecuenciaCardiaca(metricas.promedioFrecuenciaCardiaca);
        }
      } catch (error) {
        alert("error al procesar el archivo gpx. revisa que el formato sea correcto.");
      } finally {
        setProcesandoGpx(false);
        if (evento.target) evento.target.value = null;
      }
    } else {
      // logica para carga masiva
      if (!tipoActivo || !nombreActivo) {
        alert("por favor, selecciona un 'tipo' y 'nombre' de cardio antes de importar múltiples archivos.");
        if (evento.target) evento.target.value = null;
        return;
      }

      setProcesandoGpx(true);
      let archivosProcesados = 0;
      let archivosFallidos = 0;

      for (const archivo of archivos) {
        try {
          const metricas = await procesarArchivoGpx(archivo);
          const { duracionSegundos, distanciaKm, promedioFrecuenciaCardiaca, fechaString } = metricas;
          const velocidadKmh = (distanciaKm > 0 && duracionSegundos > 0) ? (distanciaKm / duracionSegundos) * 3600 : 0;
          const segundosRitmo = (distanciaKm > 0 && duracionSegundos > 0) ? duracionSegundos / distanciaKm : 0;

          await guardarSesionCardio({
            userId: user.uid,
            tipo: tipoActivo,
            nombre: nombreActivo,
            duracionSegundos,
            distancia: parseFloat(distanciaKm.toFixed(2)),
            unidadDistancia: 'km',
            cantidadUnidadRitmo: 1,
            nombreUnidadRitmo: 'km',
            segundosRitmo,
            velocidadKmh,
            fechaString,
            frecuenciaCardiacaPromedio: promedioFrecuenciaCardiaca
          });
          archivosProcesados++;
        } catch (error) {
          console.error(`error procesando ${archivo.name}:`, error);
          archivosFallidos++;
        }
      }

      setProcesandoGpx(false);
      alert(`carga masiva completada. ${archivosProcesados} archivos importados, ${archivosFallidos} fallaron.`);
      funcionRecargar();
      if (evento.target) evento.target.value = null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="flex-1"></div>
        <div className="w-48">
          <DatePicker fechaSeleccionada={fechaSeleccionada} alCambiarFecha={funcionCambiarFecha} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Combobox
          value={tipoActivo}
          onChange={(valor) => { funcionCambiarTipo(valor || ''); funcionCambiarNombre(''); }}
          options={tiposDisponibles}
          placeholder="Tipo de cardio..."
        />
        <Combobox
          value={nombreActivo}
          onChange={(valor) => funcionCambiarNombre(valor || '')}
          options={nombresDisponibles}
          placeholder="Nombre del entrenamiento..."
        />
      </div>
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">duracion</label>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Horas" value={cantidadHoras} onChange={(evento) => cambiarCantidadHoras(evento.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Min" value={cantidadMinutos} onChange={(evento) => cambiarCantidadMinutos(evento.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="number" placeholder="Seg" value={cantidadSegundos} onChange={(evento) => cambiarCantidadSegundos(evento.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">distancia</label>
          <div className="flex gap-2">
            <input type="number" placeholder="0.0" value={valorDistancia} onChange={(evento) => cambiarValorDistancia(evento.target.value)} className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={unidadDistancia} onChange={(evento) => cambiarUnidadDistancia(evento.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="km">km</option><option value="m">m</option></select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ritmo base</label>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">por cada</span>
            <input type="number" placeholder="1" value={cantidadBaseRitmo} onChange={(evento) => cambiarCantidadBaseRitmo(evento.target.value)} className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={unidadBaseRitmo} onChange={(evento) => cambiarUnidadBaseRitmo(evento.target.value)} className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="km">km</option><option value="m">m</option></select>
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700 flex justify-between items-center">
          <div className="text-center"><span className="block text-[10px] text-gray-500 uppercase">velocidad</span><span className="font-mono text-lg text-blue-400 font-bold">{velocidadCalculada.toFixed(2)} km/h</span></div>
          <div className="text-center"><span className="block text-[10px] text-gray-500 uppercase">ritmo</span><span className="font-mono text-lg text-green-400 font-bold">{formatearTiempo(segundosRitmoCalculado)} / {cantidadBaseRitmo}{unidadBaseRitmo}</span></div>
        </div>
        {frecuenciaCardiaca && (
          <div className="bg-red-900/20 rounded-lg p-3 border border-red-800/50 flex justify-center items-center gap-2">
            <span className="text-sm text-red-400">Frec. Cardíaca Promedio:</span>
            <span className="font-mono text-lg text-red-300 font-bold">{Math.round(frecuenciaCardiaca)} bpm</span>
          </div>
        )}
      </div>
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
        <h3 className="text-sm font-bold text-gray-300 mb-3">importar archivo gpx</h3>
        <input type="file" accept=".gpx" ref={referenciaInputArchivo} onChange={manejarCambioArchivo} className="hidden" multiple />
        <button 
          onClick={() => referenciaInputArchivo.current.click()}
          disabled={procesandoGpx}
          className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:cursor-wait text-white font-bold py-3 px-4 rounded-lg transition-colors text-sm"
        >
          {procesandoGpx ? 'procesando...' : 'seleccionar archivo'}
        </button>
      </div>
      <button onClick={manejarGuardado} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">GUARDAR SESION</button>
    </div>
  );
};
export default CardioRecorder;
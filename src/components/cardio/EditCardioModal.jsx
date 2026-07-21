import React, { useState, useEffect } from 'react';
import { Trash2, X, Activity } from 'lucide-react';
import Combobox from '../ui/Combobox';
import { obtenerTiposCardio, obtenerNombresCardio } from '../../services/lecturasCardio';

const EditCardioModal = ({ isOpen, onClose, onSave, onDelete, initialData, user }) => {
  const [prevId, setPrevId] = useState(initialData ? initialData.id : null);
  const [tipo, setTipo] = useState(() => initialData ? initialData.tipo || '' : '');
  const [nombre, setNombre] = useState(() => initialData ? initialData.nombre || '' : '');
  const [horas, setHoras] = useState(() => {
    if (!initialData) return '';
    const secs = initialData.duracionSegundos || 0;
    const h = Math.floor(secs / 3600);
    return h > 0 ? h.toString() : '';
  });
  const [minutos, setMinutos] = useState(() => {
    if (!initialData) return '';
    const secs = initialData.duracionSegundos || 0;
    const m = Math.floor((secs % 3600) / 60);
    return m > 0 ? m.toString() : '';
  });
  const [segundos, setSegundos] = useState(() => {
    if (!initialData) return '';
    const secs = initialData.duracionSegundos || 0;
    const s = secs % 60;
    return s > 0 ? s.toString() : '';
  });
  const [distancia, setDistancia] = useState(() => initialData ? initialData.distancia || '' : '');
  const [unidadDistancia, setUnidadDistancia] = useState(() => initialData ? initialData.unidadDistancia || 'km' : 'km');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState(() => initialData ? initialData.frecuenciaCardiacaPromedio || '' : '');

  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [nombresDisponibles, setNombresDisponibles] = useState([]);

  // Resetear estados cuando cambia el registro seleccionado (id)
  const currentId = initialData ? initialData.id : null;
  if (currentId !== prevId) {
    setPrevId(currentId);
    setTipo(initialData ? initialData.tipo || '' : '');
    setNombre(initialData ? initialData.nombre || '' : '');
    setDistancia(initialData ? initialData.distancia || '' : '');
    setUnidadDistancia(initialData ? initialData.unidadDistancia || 'km' : 'km');
    setFrecuenciaCardiaca(initialData ? initialData.frecuenciaCardiacaPromedio || '' : '');

    if (initialData) {
      const secs = initialData.duracionSegundos || 0;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setHoras(h > 0 ? h.toString() : '');
      setMinutos(m > 0 ? m.toString() : '');
      setSegundos(s > 0 ? s.toString() : '');
    } else {
      setHoras('');
      setMinutos('');
      setSegundos('');
    }
  }

  // Cargar tipos históricos del usuario
  useEffect(() => {
    const cargarTipos = async () => {
      if (user && isOpen) {
        const tipos = await obtenerTiposCardio(user.uid);
        setTiposDisponibles(tipos);
      }
    };
    cargarTipos();
  }, [user, isOpen]);

  // Cargar nombres históricos basados en el tipo
  useEffect(() => {
    const cargarNombres = async () => {
      if (user && tipo && isOpen) {
        const nombres = await obtenerNombresCardio(user.uid, tipo);
        setNombresDisponibles(nombres);
      } else {
        setNombresDisponibles([]);
      }
    };
    cargarNombres();
  }, [user, tipo, isOpen]);

  if (!isOpen || !initialData) return null;

  // Cálculos dinámicos de velocidad y ritmo
  const horasValidas = parseInt(horas, 10) || 0;
  const minutosValidos = parseInt(minutos, 10) || 0;
  const segundosValidos = parseInt(segundos, 10) || 0;
  const tiempoTotalSegundos = (horasValidas * 3600) + (minutosValidos * 60) + segundosValidos;

  const distanciaValida = parseFloat(distancia) || 0;
  const distanciaEnKm = unidadDistancia === 'km' ? distanciaValida : distanciaValida / 1000;

  let velocidadCalculada = 0;
  if (tiempoTotalSegundos > 0 && distanciaEnKm > 0) {
    velocidadCalculada = (distanciaEnKm / tiempoTotalSegundos) * 3600;
  }

  let segundosRitmoCalculado = 0;
  if (distanciaEnKm > 0 && tiempoTotalSegundos > 0) {
    segundosRitmoCalculado = (1 / distanciaEnKm) * tiempoTotalSegundos;
  }

  const formatearRitmo = (totalSegundos) => {
    if (!totalSegundos || totalSegundos === Infinity || isNaN(totalSegundos)) return "00:00";
    const mins = Math.floor(totalSegundos / 60);
    const secs = Math.floor(totalSegundos % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!tipo || !nombre) {
      alert("Por favor selecciona un tipo y nombre de cardio.");
      return;
    }
    if (distanciaValida <= 0 || tiempoTotalSegundos <= 0) {
      alert("Por favor introduce una distancia y duración válidas.");
      return;
    }

    const updatedData = {
      tipo,
      nombre,
      duracionSegundos: tiempoTotalSegundos,
      distancia: distanciaValida,
      unidadDistancia: unidadDistancia,
      cantidadUnidadRitmo: 1,
      nombreUnidadRitmo: 'km',
      segundosRitmo: segundosRitmoCalculado,
      velocidadKmh: velocidadCalculada,
      frecuenciaCardiacaPromedio: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca, 10) : null
    };

    onSave(initialData.id, updatedData);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de eliminar este registro de cardio?")) {
      onDelete(initialData.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden transform transition-all flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Editar Cardio
            </h3>
            <p className="text-xs text-gray-400">
              Modifica los detalles del ejercicio
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo de cardio */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Tipo de Cardio</label>
            <Combobox
              options={tiposDisponibles}
              value={tipo}
              onChange={setTipo}
              placeholder="Busca o escribe el tipo..."
            />
          </div>

          {/* Nombre de la actividad */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Actividad / Nombre</label>
            <Combobox
              options={nombresDisponibles}
              value={nombre}
              onChange={setNombre}
              placeholder="Busca o escribe el nombre..."
            />
          </div>

          {/* Distancia y Unidad */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Distancia</label>
              <input
                type="number"
                step="any"
                value={distancia}
                onChange={(e) => setDistancia(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div className="flex flex-col space-y-1.5 pt-5">
              <button
                type="button"
                onClick={() => setUnidadDistancia('km')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${unidadDistancia === 'km' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                KM
              </button>
              <button
                type="button"
                onClick={() => setUnidadDistancia('m')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${unidadDistancia === 'm' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                M
              </button>
            </div>
          </div>

          {/* Duración (H:M:S) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Duración</label>
            <div className="flex justify-between items-center gap-2">
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-1.5 text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-gray-500">Horas</span>
              </div>
              <span className="text-gray-500 font-bold mb-4">:</span>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-1.5 text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-gray-500">Minutos</span>
              </div>
              <span className="text-gray-500 font-bold mb-4">:</span>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="00"
                  value={segundos}
                  onChange={(e) => setSegundos(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-1.5 text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-gray-500">Segundos</span>
              </div>
            </div>
          </div>

          {/* Frecuencia Cardíaca */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider flex items-center gap-1">
              <Activity size={12} className="text-red-400" />
              FC Promedio (PPM)
            </label>
            <input
              type="number"
              value={frecuenciaCardiaca}
              onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej. 140"
            />
          </div>

          {/* Estadísticas de referencia instantáneas */}
          {distanciaValida > 0 && tiempoTotalSegundos > 0 && (
            <div className="bg-gray-900/30 border border-gray-700/50 p-3 rounded-lg grid grid-cols-2 divide-x divide-gray-700 text-center font-mono">
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Velocidad</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {velocidadCalculada.toFixed(2)} <span className="text-xs font-normal text-gray-400">km/h</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Ritmo</div>
                <div className="text-sm font-bold text-blue-400 mt-0.5">
                  {formatearRitmo(segundosRitmoCalculado)} <span className="text-xs font-normal text-gray-400">/km</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-900/30 border-t border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
          >
            Guardar Cambios
          </button>
          
          <button
            onClick={handleDelete}
            className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Eliminar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardioModal;

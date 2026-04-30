import React, { useRef } from 'react';
import { downloadAsPNG } from '../../utils/downloadImage';
import MarcaAgua from '../ui/MarcaAgua';

const CardioSessionCard = ({ sesionesDelDia, fechaSesion, nombreUsuario }) => {
  const referenciaTarjeta = useRef(null);

  const formatearTiempo = (totalSegundos) => {
    if (!totalSegundos) return "00:00";
    const horasExtraidas = Math.floor(totalSegundos / 3600);
    const minutosExtraidos = Math.floor((totalSegundos % 3600) / 60);
    const segundosExtraidos = Math.floor(totalSegundos % 60);
    if (horasExtraidas > 0) {
      return `${horasExtraidas}h ${minutosExtraidos}m ${segundosExtraidos}s`;
    }
    return `${minutosExtraidos}m ${segundosExtraidos}s`;
  };

  const formatearRitmo = (totalSegundos) => {
    if (!totalSegundos) return "00:00";
    const minutosExtraidos = Math.floor(totalSegundos / 60);
    const segundosExtraidos = Math.floor(totalSegundos % 60);
    return `${minutosExtraidos.toString().padStart(2, '0')}:${segundosExtraidos.toString().padStart(2, '0')}`;
  };

  let sumatoriaDistanciaKm = 0;
  let sumatoriaTiempoSegundos = 0;

  sesionesDelDia.forEach((sesionUnica) => {
    const distanciaEnKm = sesionUnica.unidadDistancia === 'km' ? sesionUnica.distancia : sesionUnica.distancia / 1000;
    sumatoriaDistanciaKm += distanciaEnKm;
    sumatoriaTiempoSegundos += sesionUnica.duracionSegundos;
  });

  const promedioVelocidad = sumatoriaTiempoSegundos > 0 ? (sumatoriaDistanciaKm / sumatoriaTiempoSegundos) * 3600 : 0;

  return (
    <div ref={referenciaTarjeta} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg relative">
      <div className="bg-gray-750 pt-4 px-4 pb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white capitalize">
            {new Date(fechaSesion + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            <span className="text-gray-500 ml-2 text-sm font-normal">{new Date(fechaSesion + 'T12:00:00').getFullYear()}</span>
          </h3>
        </div>
        <button onClick={() => downloadAsPNG(referenciaTarjeta, 'cardio_' + fechaSesion)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors" title="descargar sesion">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-700 border-t border-b border-gray-700 bg-gray-800/50">
        <div className="p-3 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider">distancia total</div><div className="text-xl font-bold text-white">{sumatoriaDistanciaKm.toFixed(2)} <span className="text-sm text-gray-400">km</span></div></div>
        <div className="p-3 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider">tiempo total</div><div className="text-xl font-bold text-white">{formatearTiempo(sumatoriaTiempoSegundos)}</div></div>
        <div className="p-3 text-center"><div className="text-xs text-gray-500 uppercase tracking-wider">vel promedio</div><div className="text-xl font-bold text-white">{promedioVelocidad.toFixed(2)} <span className="text-sm text-gray-400">km/h</span></div></div>
      </div>

      <div className="p-4 space-y-4">
        {sesionesDelDia.map((sesionUnica, indiceBucle) => (
          <div key={sesionUnica.id || indiceBucle} className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="flex justify-between items-baseline mb-2">
              <div className="flex items-center gap-2"><h4 className="text-white font-bold capitalize text-base">{sesionUnica.nombre}</h4><span className="text-[10px] px-2 py-0.5 rounded-full capitalize border border-gray-600 bg-gray-700/50 text-gray-400">{sesionUnica.tipo}</span></div>
            </div>
            <div className="flex justify-between text-sm font-mono text-gray-300">
              <div><span className="text-white font-bold">{sesionUnica.distancia}</span> {sesionUnica.unidadDistancia}</div>
              <div>{formatearTiempo(sesionUnica.duracionSegundos)}</div>
              <div className="text-blue-400">{formatearRitmo(sesionUnica.segundosRitmo)} / {sesionUnica.cantidadUnidadRitmo}{sesionUnica.nombreUnidadRitmo}</div>
            </div>
          </div>
        ))}
      </div>
      <MarcaAgua userName={nombreUsuario} />
    </div>
  );
};
export default CardioSessionCard;
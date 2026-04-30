import React from 'react';

const TarjetaEstadistica = ({ tituloTarjeta, children }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
      {tituloTarjeta}
    </h3>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const CardioStatsPanel = ({ sesionReciente, recordsCardio }) => {
  const formatearFecha = (cadenaFecha) => {
    if (!cadenaFecha) return '';
    return new Date(cadenaFecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
  };

  const formatearTiempo = (totalSegundos) => {
    if (!totalSegundos) return "00:00";
    const horasExtraidas = Math.floor(totalSegundos / 3600);
    const minutosExtraidos = Math.floor((totalSegundos % 3600) / 60);
    const segundosExtraidos = Math.floor(totalSegundos % 60);
    if (horasExtraidas > 0) {
      return `${horasExtraidas}:${minutosExtraidos.toString().padStart(2, '0')}:${segundosExtraidos.toString().padStart(2, '0')}`;
    }
    return `${minutosExtraidos.toString().padStart(2, '0')}:${segundosExtraidos.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <TarjetaEstadistica tituloTarjeta="ultima sesion">
        {sesionReciente ? (
          <div className="text-center">
            <div className="text-sm text-blue-400 mb-2 font-medium">{formatearFecha(sesionReciente.fechaString)}</div>
            <div className="text-xl font-bold text-white mb-1">
              {sesionReciente.distancia}<span className="text-sm text-gray-400 font-normal mx-1">{sesionReciente.unidadDistancia}</span><span className="text-lg text-gray-300 font-medium">en {formatearTiempo(sesionReciente.duracionSegundos)}</span>
            </div>
            <div className="text-xs text-gray-400">{(sesionReciente.velocidadKmh || 0).toFixed(2)} km/h • ritmo: {formatearTiempo(sesionReciente.segundosRitmo)} / {sesionReciente.cantidadUnidadRitmo}{sesionReciente.nombreUnidadRitmo}</div>
          </div>
        ) : (<span className="text-gray-500 italic text-center">sin registros</span>)}
      </TarjetaEstadistica>

      <TarjetaEstadistica tituloTarjeta="pr distancia">
        {recordsCardio?.recordDistancia ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{recordsCardio.recordDistancia.distancia}<span className="text-lg text-gray-400 ml-1">{recordsCardio.recordDistancia.unidadDistancia}</span></div>
            <div className="text-xs text-gray-500 mt-2 leading-tight">logrado el {formatearFecha(recordsCardio.recordDistancia.fechaString)}</div>
          </div>
        ) : (<span className="text-gray-500 italic text-center">n/a</span>)}
      </TarjetaEstadistica>

      <TarjetaEstadistica tituloTarjeta="pr velocidad">
        {recordsCardio?.recordVelocidad ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{recordsCardio.recordVelocidad.velocidadKmh.toFixed(2)}<span className="text-lg text-green-600 ml-1">km/h</span></div>
            <div className="text-xs text-gray-500 mt-2 leading-tight">ritmo: {formatearTiempo(recordsCardio.recordVelocidad.segundosRitmo)} / {recordsCardio.recordVelocidad.cantidadUnidadRitmo}{recordsCardio.recordVelocidad.nombreUnidadRitmo}<br /><span className="opacity-75">logrado el {formatearFecha(recordsCardio.recordVelocidad.fechaString)}</span></div>
          </div>
        ) : (<span className="text-gray-500 italic text-center">n/a</span>)}
      </TarjetaEstadistica>
    </div>
  );
};

export default CardioStatsPanel;
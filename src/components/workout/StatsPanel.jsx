import React from "react";
import HelpMarker from "../ui/HelpMarker";

const StatCard = ({ title, children }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const convertWeight = (weight, fromUnit, toUnit) => {
  if (!weight) return 0;
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'kg' && toUnit === 'lb') return weight * 2.20462;
  if (fromUnit === 'lb' && toUnit === 'kg') return weight / 2.20462;
  return weight;
};

const getRpeColor = (rpe) => {
  if (!rpe) return '';
  if (rpe >= 9) return 'text-red-400';
  if (rpe >= 7) return 'text-yellow-400';
  return 'text-green-400';
};

// Helper para formatear fechas de forma amigable
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    year: '2-digit'
  });
};

const StatsPanel = ({ stats, loading, currentUnit = 'kg' }) => {
  if (loading) {
    return (
      <div className="w-full p-8 text-center text-gray-400 animate-pulse">
        Cargando estadísticas...
      </div>
    );
  }

  if (!stats) return null;

  const { lastSession, pr1rm, prWeight } = stats;
  const hasData = (lastSession && lastSession.length > 0) || pr1rm || prWeight;

  if (!hasData) {
    return (
      <div className="w-full p-6 text-center text-gray-500 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
        Sin datos registrados para este ejercicio.
      </div>
    );
  }

  // ordenar sets de la ultima sesion por orden de ejecucion
  const sortedSession = lastSession
    ? [...lastSession].sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.setOrder - b.setOrder;
      })
    : [];

  // pre procesamiento de etiquetas para conteo correcto
  let effectiveSetCount = 0;
  const processedSession = sortedSession.map((set) => {
    let displayLabel;
    let labelColor;

    if (set.isWarmup) {
      displayLabel = "W";
      labelColor = "text-sky-400 font-bold";
    } else if (set.isDropSet) {
      displayLabel = "↳";
      labelColor = "text-gray-500";
    } else {
      effectiveSetCount++;
      displayLabel = `#${effectiveSetCount}`;
      labelColor = "text-gray-500";
    }
    return { ...set, displayLabel, labelColor };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* tarjeta 1 ultima sesion */}
      <HelpMarker text="Resumen de tu último entrenamiento de este ejercicio">
      <StatCard title="Última Sesión">
        {processedSession.length > 0 ? (
          <div>
            <div className="text-sm text-blue-400 mb-2 font-medium">
              {formatDate(processedSession[0].dateString)}
            </div>
            <ul className="space-y-1">
              {processedSession.map((set, index) => {
                const convertedWeight = convertWeight(set.weight, set.unit, currentUnit);
                const displayWeight = set.unit === currentUnit 
                  ? set.weight 
                  : parseFloat(convertedWeight.toFixed(2));
                
                const converted1RM = convertWeight(set.estimated1RM, set.unit, currentUnit);

                return (
                  <li key={index} className={`text-sm font-mono flex items-center ${set.isDropSet ? 'text-gray-400 ml-4' : 'text-gray-300'}`}>
                    <span className={`mr-2 ${set.labelColor}`}>{set.displayLabel}</span>
                    {displayWeight}
                    {currentUnit} <span className="text-gray-500 mx-1">x</span> {set.reps}
                    <span className="text-[10px] text-gray-500 ml-1 opacity-80">(1RM: {Math.round(converted1RM)}{currentUnit})</span>
                    {set.rpe && (
                      <span className={`ml-2 text-xs font-bold ${getRpeColor(set.rpe)}`}>
                        @ RPE {set.rpe}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <span className="text-gray-500 italic">No disponible</span>
        )}
      </StatCard>
      </HelpMarker>

      {/* tarjeta 2 mejor 1rm */}
      <HelpMarker text="Tu récord personal estimado de 1 repetición máxima">
      <StatCard title="Mejor 1RM (Est.)">
        {pr1rm ? (() => {
          const converted1RM = convertWeight(pr1rm.estimated1RM, pr1rm.unit, currentUnit);
          return (
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {Math.round(converted1RM)}
                <span className="text-lg text-gray-400 ml-1">{currentUnit}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 leading-tight">
                Basado en: {pr1rm.weight}{pr1rm.unit} x {pr1rm.reps}
                <br />
                <span className="opacity-75">(Serie #{pr1rm.setOrder} el {formatDate(pr1rm.dateString)})</span>
                {pr1rm.rpe && (
                  <span className={`block mt-1 font-bold ${getRpeColor(pr1rm.rpe)}`}>
                    RPE {pr1rm.rpe}
                  </span>
                )}
              </div>
            </div>
          );
        })() : (
          <span className="text-gray-500 italic text-center">N/A</span>
        )}
      </StatCard>
      </HelpMarker>

      {/* tarjeta 3 peso maximo */}
      <HelpMarker text="El peso más alto que has levantado en este ejercicio">
      <StatCard title="Peso Máximo">
        {prWeight ? (() => {
          const convertedWeight = convertWeight(prWeight.weight, prWeight.unit, currentUnit);
          // Redondear a 2 decimales si es conversión, o mantener original si es igual
          const displayWeight = prWeight.unit === currentUnit 
            ? prWeight.weight 
            : parseFloat(convertedWeight.toFixed(2));

          return (
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {displayWeight}
                <span className="text-lg text-green-600 ml-1">
                  {currentUnit}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2 leading-tight">
                Original: {prWeight.weight}{prWeight.unit} x {prWeight.reps} reps
                <br />
                <span className="opacity-75">(Serie #{prWeight.setOrder} el {formatDate(prWeight.dateString)})</span>
                {prWeight.rpe && (
                  <span className={`block mt-1 font-bold ${getRpeColor(prWeight.rpe)}`}>
                    RPE {prWeight.rpe}
                  </span>
                )}
              </div>
            </div>
          );
        })() : (
          <span className="text-gray-500 italic text-center">N/A</span>
        )}
      </StatCard>
      </HelpMarker>
    </div>
  );
};

export default StatsPanel;

import React from "react";

const StatCard = ({ title, children }) => (
  <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    <div className="flex-1 flex flex-col justify-center">{children}</div>
  </div>
);

const StatsPanel = ({ stats, loading }) => {
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

  // Ordenar sets de la última sesión por orden de ejecución
  const sortedSession = lastSession
    ? [...lastSession].sort((a, b) => a.setOrder - b.setOrder)
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Tarjeta 1: Última Sesión */}
      <StatCard title="Última Sesión">
        {sortedSession.length > 0 ? (
          <div>
            <div className="text-sm text-blue-400 mb-2 font-medium">
              {sortedSession[0].dateString}
            </div>
            <ul className="space-y-1">
              {sortedSession.map((set, index) => (
                <li key={index} className="text-sm text-gray-300 font-mono">
                  <span className="text-gray-500 mr-2">#{index + 1}</span>
                  {set.weight}
                  {set.unit} <span className="text-gray-500">x</span> {set.reps}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-gray-500 italic">No disponible</span>
        )}
      </StatCard>

      {/* Tarjeta 2: Mejor 1RM */}
      <StatCard title="Mejor 1RM (Est.)">
        {pr1rm ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-white">
              {Math.round(pr1rm.estimated1RM)}
              <span className="text-lg text-gray-400 ml-1">{pr1rm.unit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Basado en: {pr1rm.weight}
              {pr1rm.unit} x {pr1rm.reps}
            </div>
          </div>
        ) : (
          <span className="text-gray-500 italic text-center">N/A</span>
        )}
      </StatCard>

      {/* Tarjeta 3: Peso Máximo */}
      <StatCard title="Peso Máximo">
        {prWeight ? (
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {prWeight.weight}
              <span className="text-lg text-green-600 ml-1">
                {prWeight.unit}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              x {prWeight.reps} reps
            </div>
          </div>
        ) : (
          <span className="text-gray-500 italic text-center">N/A</span>
        )}
      </StatCard>
    </div>
  );
};

export default StatsPanel;

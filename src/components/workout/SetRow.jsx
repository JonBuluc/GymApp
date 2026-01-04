import React from 'react';
import HelpMarker from '../ui/HelpMarker';

const SetRow = ({ set, index, unit, onChange, onRemove, isMultiple }) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      {/* columna orden */}
      <div className={`col-span-1 text-center font-mono font-bold ${set.displayOrder === 'W' ? 'text-orange-500' : 'text-blue-400'}`}>
        {set.displayOrder}
      </div>

      {/* columna controles (warmup / dropset) */}
      <div className="col-span-1 flex justify-center">
        {index === 0 ? (
          <HelpMarker text="Calentamiento" className="flex justify-center">
            <input 
              type="checkbox" 
              checked={set.isWarmup} 
              onChange={(e) => onChange(set.id, 'isWarmup', e.target.checked)} 
              className="w-5 h-5 rounded border-gray-600 text-blue-600 bg-gray-700" 
            />
          </HelpMarker>
        ) : (
          <div className="flex justify-center w-full">
            {index === 1 ? (
              <HelpMarker text="Drop Set" className="flex justify-center">
                <DropSetButton isDropSet={set.isDropSet} onClick={() => onChange(set.id, 'isDropSet', !set.isDropSet)} />
              </HelpMarker>
            ) : (
              <DropSetButton isDropSet={set.isDropSet} onClick={() => onChange(set.id, 'isDropSet', !set.isDropSet)} />
            )}
          </div>
        )}
      </div>

      {/* columna peso */}
      <div className="col-span-3">
        {index === 0 ? (
          <HelpMarker text="Peso">
            <input type="number" value={set.weight} onChange={(e) => onChange(set.id, 'weight', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </HelpMarker>
        ) : (
          <input type="number" value={set.weight} onChange={(e) => onChange(set.id, 'weight', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      {/* columna reps */}
      <div className="col-span-2">
        {index === 0 ? (
          <HelpMarker text="Reps">
            <input type="number" value={set.reps} onChange={(e) => onChange(set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </HelpMarker>
        ) : (
          <input type="number" value={set.reps} onChange={(e) => onChange(set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      {/* columna rpe */}
      <div className="col-span-2">
        {index === 0 ? (
          <HelpMarker text="Escala de Esfuerzo (1-10)" position="bottom">
            <input type="number" value={set.rpe} onChange={(e) => onChange(set.id, 'rpe', e.target.value)} placeholder="-" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </HelpMarker>
        ) : (
          <input type="number" value={set.rpe} onChange={(e) => onChange(set.id, 'rpe', e.target.value)} placeholder="-" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        )}
      </div>

      {/* columna 1rm */}
      <div className="col-span-2 text-center font-mono text-gray-300 text-sm">
        {index === 0 ? (
          <HelpMarker text="Repetición Máxima Estimada">
            <span>{set.calculated1RM > 0 ? Math.round(set.calculated1RM) : '-'}</span>
          </HelpMarker>
        ) : (
          set.calculated1RM > 0 ? Math.round(set.calculated1RM) : '-'
        )}
      </div>

      {/* columna eliminar */}
      <div className="col-span-1 flex justify-center">
        {isMultiple && (
          <button onClick={() => onRemove(set.id)} className="text-gray-500 hover:text-red-500">✕</button>
        )}
      </div>
    </div>
  );
};

// componente interno pequeño para el boton de dropset
const DropSetButton = ({ isDropSet, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-1 rounded-full transition-all ${isDropSet ? 'text-blue-400 bg-blue-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'}`}
    title="Marcar como Drop Set"
  >
    {isDropSet ? (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" clipRule="evenodd" /></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" /></svg>
    )}
  </button>
);

export default SetRow;
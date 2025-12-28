import React, { useState, useEffect } from 'react';

const EditSetModal = ({ isOpen, onClose, onSave, onDelete, initialData }) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isWarmup, setIsWarmup] = useState(false);
  const [isDropSet, setIsDropSet] = useState(false);

  useEffect(() => {
    if (initialData) {
      setWeight(initialData.weight);
      setReps(initialData.reps);
      setRpe(initialData.rpe || '');
      setUnit(initialData.unit || 'kg');
      setIsWarmup(initialData.isWarmup || false);
      setIsDropSet(initialData.isDropSet || false);
    }
  }, [initialData]);

  if (!isOpen || !initialData) return null;

  const handleSave = () => {
    const updatedData = {
      weight: parseFloat(weight),
      reps: parseInt(reps, 10),
      rpe: rpe ? parseFloat(rpe) : null,
      unit,
      isWarmup,
      isDropSet
    };
    onSave(initialData.id, updatedData);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de eliminar esta serie?")) {
      onDelete(initialData.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden transform transition-all">
        {/* header */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white capitalize text-center truncate">
            {initialData.exercise}
          </h3>
          <div className="text-xs text-gray-400 text-center mt-1 uppercase tracking-wider">
            Editar Serie
          </div>
        </div>

        {/* body */}
        <div className="p-6 space-y-6">
          {/* peso y unidad */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Peso</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-3xl font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div className="flex flex-col space-y-2 pt-5">
              <button
                onClick={() => setUnit('kg')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${unit === 'kg' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                KG
              </button>
              <button
                onClick={() => setUnit('lb')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${unit === 'lb' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
              >
                LB
              </button>
            </div>
          </div>

          {/* reps y rpe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase font-bold tracking-wider">RPE</label>
              <input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="-"
              />
            </div>
          </div>

          {/* toggles */}
          <div className="space-y-3 pt-2 border-t border-gray-700/50">
            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
              <span className="text-sm font-medium text-gray-200">Calentamiento</span>
              <input
                type="checkbox"
                checked={isWarmup}
                onChange={(e) => setIsWarmup(e.target.checked)}
                className="w-5 h-5 rounded border-gray-500 text-blue-600 bg-gray-800 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
              <span className="text-sm font-medium text-gray-200">Drop Set</span>
              <input
                type="checkbox"
                checked={isDropSet}
                onChange={(e) => setIsDropSet(e.target.checked)}
                className="w-5 h-5 rounded border-gray-500 text-blue-600 bg-gray-800 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
            </label>
          </div>
        </div>

        {/* footer */}
        <div className="bg-gray-900/50 p-4 border-t border-gray-700 flex justify-between items-center gap-3">
          <button
            onClick={handleDelete}
            className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Eliminar Serie"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <div className="flex gap-3 flex-1 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 font-medium hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSetModal;
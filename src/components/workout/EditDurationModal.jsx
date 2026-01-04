import React, { useState, useEffect } from 'react';

const EditDurationModal = ({ isOpen, onClose, onSave, initialSeconds }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const secs = initialSeconds || 0;
      setHours(Math.floor(secs / 3600));
      setMinutes(Math.floor((secs % 3600) / 60));
    }
  }, [isOpen, initialSeconds]);

  if (!isOpen) return null;

  const handleSave = () => {
    const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    onSave(totalSeconds);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        <h3 className="text-white font-bold mb-4 text-center">Editar Duración</h3>
        
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-400 mb-1">Horas</label>
            <input
              type="number"
              min="0"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 bg-gray-700 text-white text-center rounded-lg px-2 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-500 font-bold text-xl mt-4">:</span>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-400 mb-1">Minutos</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="w-16 bg-gray-700 text-white text-center rounded-lg px-2 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
          >
            Guardar
          </button>
          <button 
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDurationModal;
import React, { useState } from 'react';
import { updateUserAlias } from './auth';

const EditProfileModal = ({ isOpen, onClose, currentUser }) => {
  const [alias, setAlias] = useState(currentUser?.displayName || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Evitar guardar si el alias está vacío o es idéntico al actual
    if (!alias.trim() || alias === currentUser?.displayName) return;
    
    setLoading(true);
    try {
      await updateUserAlias(currentUser, alias);
      onClose();
      // Recarga rápida para actualizar el estado global de Firebase en la UI
      window.location.reload();
    } catch (error) {
      alert("Error al actualizar el alias. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Editar Alias</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              ¿Cómo quieres que te llamemos?
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={20}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ej. Iron Lift"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !alias.trim() || alias === currentUser?.displayName}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
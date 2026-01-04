import React, { useState, useEffect } from 'react';
import Combobox from '../ui/Combobox';
import { getExerciseCatalog } from '../../services/firestore';

const BulkEditModal = ({ isOpen, onClose, onSave, bulkEditData, availableMuscles, user }) => {
  const [tempMuscle, setTempMuscle] = useState('');
  const [tempExercise, setTempExercise] = useState('');
  const [modalExercises, setModalExercises] = useState([]);

  // Inicializar valores cuando se abre el modal
  useEffect(() => {
    if (bulkEditData) {
      setTempMuscle(bulkEditData.initialMuscle || '');
      setTempExercise(bulkEditData.initialExercise || '');
    }
  }, [bulkEditData]);

  // Cargar ejercicios dinámicamente cuando cambia el grupo muscular
  useEffect(() => {
    const updateModalExercises = async () => {
      if (user && tempMuscle && bulkEditData?.type === 'rename_exercise') {
        const exercises = await getExerciseCatalog(user.uid, tempMuscle);
        setModalExercises(exercises);
      } else {
        setModalExercises([]);
      }
    };
    updateModalExercises();
  }, [user, tempMuscle, bulkEditData]);

  if (!isOpen || !bulkEditData) return null;

  const handleSave = () => {
    onSave({
      ...bulkEditData,
      newMuscle: tempMuscle,
      newExercise: tempExercise
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
        <h3 className="text-white font-bold mb-1">
          {bulkEditData.type === 'rename_exercise' ? 'Renombrar Ejercicio' : 'Cambiar Grupo Muscular'}
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          {bulkEditData.type === 'session' 
            ? `Cambiando todas las series marcadas como "${bulkEditData.targetName}"`
            : bulkEditData.type === 'rename_exercise'
              ? `Renombrando todas las series de "${bulkEditData.targetName}"`
              : `Cambiando todas las series de "${bulkEditData.targetName}"`}
        </p>
        
        <div className="space-y-4">
          <div>
            {bulkEditData.type === 'rename_exercise' && (
              <label className="text-xs text-gray-400 block mb-1">Grupo Muscular</label>
            )}
            <Combobox
              options={availableMuscles}
              value={tempMuscle}
              onChange={setTempMuscle}
              placeholder="Busca o escribe el grupo..."
            />
          </div>

          {bulkEditData.type === 'rename_exercise' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nuevo Nombre</label>
              <Combobox
                options={modalExercises}
                value={tempExercise}
                onChange={setTempExercise}
                placeholder="Busca o escribe el ejercicio..."
              />
            </div>
          )}
        </div>
        
        <div className="mt-6 space-y-2">
          <button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors text-sm"
          >
            Guardar Cambios
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

export default BulkEditModal;
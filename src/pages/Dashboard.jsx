import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import WorkoutRecorder from "../components/workout/WorkoutRecorder";
import SessionCard from "../components/workout/SessionCard";
import EditSetModal from "../components/workout/EditSetModal";
import BulkEditModal from "../components/workout/BulkEditModal";
import HelpMarker from "../components/ui/HelpMarker";
import StatsPanel from "../components/workout/StatsPanel";
import { getWorkoutHistory, updateWorkoutSet, deleteWorkoutSet, bulkUpdateMuscleGroup, getMuscleGroups, getExerciseStats } from "../services/firestore";

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // para forzar recarga al guardar
  const [bulkEdit, setBulkEdit] = useState(null);
  const [availableMuscles, setAvailableMuscles] = useState([]);

  // estados para orquestacion de inputs y stats
  const [currentMuscle, setCurrentMuscle] = useState('');
  const [currentExercise, setCurrentExercise] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [unit, setUnit] = useState('kg');

  // Cargar sesion del dia seleccionado
  useEffect(() => {
    const fetchSession = async () => {
      if (user && selectedDate) {
        try {
          const { sessions } = await getWorkoutHistory(user.uid, null, { date: selectedDate });
          if (sessions.length > 0) {
            setSelectedSession(sessions[0]);
          } else {
            setSelectedSession(null);
          }
        } catch (error) {
          console.error("Error cargando sesión del dashboard:", error);
        }
      }
    };
    fetchSession();
  }, [user, selectedDate, refreshTrigger]);

  // Cargar grupos musculares para el modal de edicion
  useEffect(() => {
    if (user) {
      getMuscleGroups(user.uid).then(setAvailableMuscles);
    }
  }, [user]);

  // cargar estadisticas cuando cambia el ejercicio seleccionado
  useEffect(() => {
    const fetchStats = async () => {
      if (user && currentExercise) {
        setLoadingStats(true);
        try {
          const data = await getExerciseStats(user.uid, currentExercise, currentMuscle);
          setStats(data);
        } catch (error) {
          console.error("error fetching stats:", error);
        } finally {
          setLoadingStats(false);
        }
      } else {
        setStats(null);
      }
    };
    
    const timeoutId = setTimeout(fetchStats, 500); // debounce
    return () => clearTimeout(timeoutId);
  }, [user, currentExercise, currentMuscle, refreshTrigger]);

  const handleEditSet = (set) => {
    setEditingSet(set);
    setIsModalOpen(true);
  };

  const handleSaveSet = async (setId, updatedFields) => {
    await updateWorkoutSet(setId, updatedFields);
    setRefreshTrigger(prev => prev + 1); // recargar datos frescos
    setIsModalOpen(false);
  };

  const handleDeleteSet = async (setId) => {
    await deleteWorkoutSet(setId);
    setRefreshTrigger(prev => prev + 1); // recargar datos frescos
    setIsModalOpen(false);
  };

  const handleBulkUpdate = async ({ newMuscle, newExercise, ...data }) => {
    if (!data || !newMuscle) return;
    try {
      if (data.type === 'rename_exercise') {
        if (!newExercise) return;
        await Promise.all(data.setIds.map(id => 
          updateWorkoutSet(id, { exercise: newExercise, muscleGroup: newMuscle })
        ));
      } else {
        await bulkUpdateMuscleGroup(data.setIds, newMuscle);
      }
      setBulkEdit(null);
      setRefreshTrigger(prev => prev + 1); // recargar datos frescos
    } catch (error) {
      console.error("error en update masivo dashboard:", error);
    }
  };

  const handleBulkDelete = async (data) => {
    if (!data) return;
    try {
      await Promise.all(data.setIds.map(id => deleteWorkoutSet(id)));
      setBulkEdit(null);
      setRefreshTrigger(prev => prev + 1); // recargar datos frescos
    } catch (error) {
      console.error("error en delete masivo dashboard:", error);
    }
  };

  return (
    <div className="py-6">
        <WorkoutRecorder 
          date={selectedDate} 
          setDate={setSelectedDate} 
          muscleGroup={currentMuscle}
          setMuscleGroup={setCurrentMuscle}
          exercise={currentExercise}
          setExercise={setCurrentExercise}
          unit={unit}
          setUnit={setUnit}
          onSaveSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />
        
        {/* panel de estadisticas (solo si hay ejercicio seleccionado) */}
        {currentExercise && (
          <div className="max-w-3xl mx-auto px-4 mt-6">
            <div className="mb-2">
              <HelpMarker text={<>
                Estadísticas rápidas y récords históricos del ejercicio que estás registrando actualmente.<br />
                Para ayudar a seleccionar peso y repeticiones a sus series actuales.
              </>}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Referencia del Ejercicio</h3>
              </HelpMarker>
            </div>
            <StatsPanel stats={stats} loading={loadingStats} currentUnit={unit} />
          </div>
        )}

        {selectedSession && (
          <div className="max-w-3xl mx-auto px-4 mt-8">
            <h2 className="text-xl font-bold text-white mb-4">Resumen del Día</h2>
            <HelpMarker text={<>
              Listado de todos los ejercicios y series completados en la fecha seleccionada.<br />
              Puedes editar todo el día.
            </>}>
              <SessionCard 
                session={selectedSession} 
                displayUnit={unit}
                onEditSet={handleEditSet}
                onBulkEdit={setBulkEdit}
                userName={user?.displayName || user?.email}
              />
            </HelpMarker>
          </div>
        )}

        <EditSetModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveSet} 
          onDelete={handleDeleteSet} 
          initialData={editingSet} 
        />

        <BulkEditModal 
          isOpen={!!bulkEdit}
          onClose={() => setBulkEdit(null)}
          onSave={handleBulkUpdate}
          onDelete={handleBulkDelete}
          bulkEditData={bulkEdit}
          availableMuscles={availableMuscles}
          user={user}
        />
    </div>
  );
};

export default Dashboard;

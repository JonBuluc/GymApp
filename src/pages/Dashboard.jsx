import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import WorkoutRecorder from "../components/workout/WorkoutRecorder";
import SessionCard from "../components/workout/SessionCard";
import EditSetModal from "../components/workout/EditSetModal";
import BulkEditModal from "../components/workout/BulkEditModal";
import HelpMarker from "../components/ui/HelpMarker";
import StatsPanel from "../components/workout/StatsPanel";
import { getWorkoutHistory, updateWorkoutSet, deleteWorkoutSet, bulkUpdateMuscleGroup, getMuscleGroups, getExerciseStats } from "../services/firestore";
import CardioRecorder from "../components/cardio/CardioRecorder";
import CardioStatsPanel from "../components/cardio/CardioStatsPanel";
import CardioSessionCard from "../components/cardio/CardioSessionCard";
import { obtenerHistorialCardio, obtenerRecordsCardio } from "../services/lecturasCardio";

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

  const [modoEntrenamiento, setModoEntrenamiento] = useState('fuerza');

  // estados adicionales para cardio
  const [historialCardio, setHistorialCardio] = useState([]);
  const [recordsCardio, setRecordsCardio] = useState(null);
  const [tipoCardioActivo, setTipoCardioActivo] = useState("");
  const [nombreCardioActivo, setNombreCardioActivo] = useState("");

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

  // cargar historial cardio
  useEffect(() => {
    const cargarDatosCardio = async () => {
      if (user && selectedDate && modoEntrenamiento === 'cardio') {
        try {
          const historial = await obtenerHistorialCardio(user.uid, selectedDate);
          setHistorialCardio(historial);
        } catch (errorConsulta) {
          console.error("error cargando historial de cardio", errorConsulta);
        }
      }
    };
    cargarDatosCardio();
  }, [user, selectedDate, refreshTrigger, modoEntrenamiento]);

  // cargar estadisticas cardio
  useEffect(() => {
    const cargarRecordsCardio = async () => {
      if (user && tipoCardioActivo && nombreCardioActivo && modoEntrenamiento === 'cardio') {
        try {
          const records = await obtenerRecordsCardio(user.uid, tipoCardioActivo, nombreCardioActivo);
          setRecordsCardio(records);
        } catch (errorConsulta) {
          console.error("error cargando records de cardio", errorConsulta);
        }
      } else {
        setRecordsCardio(null);
      }
    };
    cargarRecordsCardio();
  }, [user, tipoCardioActivo, nombreCardioActivo, refreshTrigger, modoEntrenamiento]);

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
        {/* selector de modo de entrenamiento */}
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setModoEntrenamiento('fuerza')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${modoEntrenamiento === 'fuerza' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Fuerza
            </button>
            <button
              onClick={() => setModoEntrenamiento('cardio')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-colors ${modoEntrenamiento === 'cardio' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Cardio
            </button>
          </div>
        </div>

        {modoEntrenamiento === 'fuerza' ? (
          <>
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
          </>
        ) : (
          <>
            <CardioRecorder 
              fechaSeleccionada={selectedDate}
              funcionCambiarFecha={setSelectedDate}
              funcionRecargar={() => setRefreshTrigger(prev => prev + 1)}
              tipoActivo={tipoCardioActivo}
              funcionCambiarTipo={setTipoCardioActivo}
              nombreActivo={nombreCardioActivo}
              funcionCambiarNombre={setNombreCardioActivo}
            />
            {nombreCardioActivo && (
              <div className="max-w-3xl mx-auto px-4 mt-6">
                <div className="mb-2">
                  <HelpMarker text={<>Estadísticas rápidas y récords históricos de tu actividad cardiovascular actual.</>}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Referencia de Cardio</h3>
                  </HelpMarker>
                </div>
                <CardioStatsPanel sesionReciente={recordsCardio?.sesionReciente} recordsCardio={recordsCardio} />
              </div>
            )}
            {historialCardio.length > 0 && (
              <div className="max-w-3xl mx-auto px-4 mt-8">
                <CardioSessionCard sesionesDelDia={historialCardio} fechaSesion={selectedDate} nombreUsuario={user?.displayName || user?.email} />
              </div>
            )}
          </>
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

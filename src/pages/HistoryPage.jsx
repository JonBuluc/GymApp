import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkoutHistory, getMuscleGroups, getExerciseCatalog, updateWorkoutSet, deleteWorkoutSet } from '../services/firestore';
import Combobox from '../components/ui/Combobox';
import EditSetModal from '../components/workout/EditSetModal';

// funcion auxiliar para recalcular totales de sesion
const recalculateSession = (session, updatedExercises) => {
  let totalVolumeKg = 0;
  let totalSets = 0;
  const muscleGroups = new Set();

  updatedExercises.forEach(ex => {
    const weight = parseFloat(ex.weight) || 0;
    const reps = parseInt(ex.reps, 10) || 0;
    const weightInKg = ex.unit === 'lb' ? weight * 0.453592 : weight;
    totalVolumeKg += weightInKg * reps;

    if (!ex.isWarmup) {
      totalSets += 1;
    }
    if (ex.muscleGroup) muscleGroups.add(ex.muscleGroup);
  });

  return {
    ...session,
    exercises: updatedExercises,
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
    totalSets,
    muscleGroups: Array.from(muscleGroups)
  };
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [displayUnit, setDisplayUnit] = useState('kg');
  const [isLoading, setIsLoading] = useState(false);
  
  // paginacion
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState([null]); // historial de cursores para navegar

  // filtros
  const [filterDate, setFilterDate] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('all');
  const [filterExercise, setFilterExercise] = useState('all');

  // listas dinamicas
  const [availableMuscles, setAvailableMuscles] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);

  // estado de edicion
  const [editingSet, setEditingSet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // cargar grupos musculares al inicio
  useEffect(() => {
    if (user) {
      getMuscleGroups(user.uid).then(setAvailableMuscles);
    }
  }, [user]);

  // cargar ejercicios cuando cambia el musculo
  useEffect(() => {
    const updateExercises = async () => {
      if (user && filterMuscle && filterMuscle !== 'all') {
        const exercises = await getExerciseCatalog(user.uid, filterMuscle);
        setAvailableExercises(exercises);
      } else {
        setAvailableExercises([]);
      }
      // resetear ejercicio al cambiar musculo para evitar filtros invalidos
      setFilterExercise('all');
    };
    updateExercises();
  }, [user, filterMuscle]);

  const loadData = useCallback(async (pageIndex, cursorToUse) => {
    setIsLoading(true);
    try {
      const filters = {
        date: filterDate,
        muscle: filterMuscle,
        exercise: filterExercise
      };

      const { sessions, lastDoc: nextDoc } = await getWorkoutHistory(user.uid, cursorToUse, filters);
      
      setHistoryData(sessions);
      
      // guardar el cursor para la siguiente pagina
      setCursors(prev => {
        const newCursors = [...prev];
        newCursors[pageIndex + 1] = nextDoc;
        return newCursors;
      });
    } catch (error) {
      console.error("Error loading history", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filterDate, filterMuscle, filterExercise]);

  // cargar historial cuando cambian los filtros
  useEffect(() => {
    if (user) {
      setPage(0);
      setCursors([null]);
      loadData(0, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterDate, filterMuscle, filterExercise]);

  const handleNextPage = () => {
    const nextPage = page + 1;
    if (cursors[nextPage] !== undefined) {
      setPage(nextPage);
      loadData(nextPage, cursors[nextPage]);
    }
  };

  const handlePrevPage = () => {
    const prevPage = page - 1;
    if (prevPage >= 0) {
      setPage(prevPage);
      loadData(prevPage, cursors[prevPage]);
    }
  };

  const convertWeight = (weight, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return weight;
    if (fromUnit === 'kg' && toUnit === 'lb') return weight * 2.20462;
    if (fromUnit === 'lb' && toUnit === 'kg') return weight / 2.20462;
    return weight;
  };

  const isFiltering = filterDate || filterMuscle !== 'all' || filterExercise !== 'all';

  const handleEditClick = (set) => {
    setEditingSet(set);
    setIsModalOpen(true);
  };

  const handleSaveSet = async (setId, updatedFields) => {
    try {
      await updateWorkoutSet(setId, updatedFields);
      
      // actualizacion local optimista
      setHistoryData(prevData => {
        return prevData.map(session => {
          // verificar si el set pertenece a esta sesion
          const setIndex = session.exercises.findIndex(ex => ex.id === setId);
          if (setIndex === -1) return session;

          const updatedExercises = [...session.exercises];
          updatedExercises[setIndex] = { ...updatedExercises[setIndex], ...updatedFields };

          return recalculateSession(session, updatedExercises);
        });
      });
      
      setIsModalOpen(false);
      setEditingSet(null);
    } catch (error) {
      console.error("Error updating set:", error);
      alert("Error al actualizar la serie.");
    }
  };

  const handleDeleteSet = async (setId) => {
    try {
      await deleteWorkoutSet(setId);

      // actualizacion local optimista
      setHistoryData(prevData => {
        return prevData.map(session => {
           const setExists = session.exercises.some(ex => ex.id === setId);
           if (!setExists) return session;

           const updatedExercises = session.exercises.filter(ex => ex.id !== setId);

           return recalculateSession(session, updatedExercises);
        }).filter(session => session.exercises.length > 0); // eliminar sesiones vacias
      });

      setIsModalOpen(false);
      setEditingSet(null);
    } catch (error) {
      console.error("Error deleting set:", error);
      alert("Error al eliminar la serie.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-20">
      {/* header */}
      <div className="flex flex-col space-y-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Historial</h1>
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button onClick={() => setDisplayUnit('kg')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${displayUnit === 'kg' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>KG</button>
            <button onClick={() => setDisplayUnit('lb')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${displayUnit === 'lb' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>LB</button>
          </div>
        </div>
        
        {/* filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* input 1 fecha */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha</label>
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                style={{ colorScheme: 'dark' }}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-10 text-gray-400 hover:text-white"
                  title="Limpiar fecha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* input 2 grupo muscular */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Grupo Muscular</label>
            <Combobox
              options={availableMuscles}
              value={filterMuscle === 'all' ? '' : filterMuscle}
              onChange={(val) => setFilterMuscle(val || 'all')}
              placeholder="Filtrar por músculo..."
            />
          </div>

          {/* input 3 ejercicio */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Ejercicio</label>
            <Combobox
              options={availableExercises}
              value={filterExercise === 'all' ? '' : filterExercise}
              onChange={(val) => setFilterExercise(val || 'all')}
              placeholder="Filtrar por ejercicio..."
            />
          </div>
        </div>
      </div>

      {/* lista de sesiones */}
      <div className="space-y-4">
        {historyData.map((session, idx) => {
          const displayVolume = displayUnit === 'kg' 
            ? session.totalVolumeKg 
            : session.totalVolumeKg * 2.20462;

          // agrupar series por ejercicio
          const exerciseGroups = [];
          const groupsMap = {};
          
          session.exercises.forEach(set => {
            const key = set.exercise;
            if (!groupsMap[key]) {
              groupsMap[key] = {
                name: set.exercise,
                sets: [],
                volume: 0
              };
              exerciseGroups.push(groupsMap[key]);
            }
            groupsMap[key].sets.push(set);
            
            const w = convertWeight(set.weight, set.unit, displayUnit);
            groupsMap[key].volume += w * set.reps;
          });

          return (
            <div key={`${session.date}-${idx}`} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
              {/* card header */}
              <div className="bg-gray-750 p-4 border-b border-gray-700 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white capitalize">
                    {new Date(session.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    <span className="text-gray-500 ml-2 text-sm font-normal">{new Date(session.date + 'T12:00:00').getFullYear()}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.muscleGroups.map(mg => (
                      <span key={mg} className="bg-gray-700 text-xs rounded-full px-2 py-1 mr-2 text-gray-300 border border-gray-600 uppercase">
                        {mg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* metrics */}
              <div className="grid grid-cols-3 divide-x divide-gray-700 border-b border-gray-700 bg-gray-800/50">
                <div className="p-3 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Volumen Total</div>
                  <div className="text-xl font-bold text-white">
                    {Math.round(displayVolume).toLocaleString()} <span className="text-sm text-gray-400">{displayUnit}</span>
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Series Efectivas</div>
                  <div className="text-xl font-bold text-white">
                    {session.totalSets}
                  </div>
                </div>
                <div className="p-3 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Ejercicios</div>
                  <div className="text-xl font-bold text-white">
                    {exerciseGroups.length}
                  </div>
                </div>
              </div>

              {/* exercises list */}
              <div className="p-4 space-y-6">
                {exerciseGroups.map((group, gIdx) => {
                  let effectiveSetCount = 0;
                  return (
                    <div key={gIdx} className="space-y-2">
                      {/* exercise header */}
                      <div className="flex justify-between items-baseline border-b border-gray-800 pb-1 mb-2">
                        <h4 className="text-white font-bold capitalize text-lg">{group.name}</h4>
                        <span className="text-xs text-gray-500">
                          Total: {Math.round(group.volume).toLocaleString()} {displayUnit}
                        </span>
                      </div>
                      
                      {/* sets list */}
                      <div className="space-y-1">
                        {group.sets.map((set) => {
                          let label = "";
                          let labelColor = "";
                          
                          if (set.isWarmup) {
                            label = "W";
                            labelColor = "text-sky-400";
                          } else if (set.isDropSet) {
                            label = "↳";
                            labelColor = "text-gray-500";
                          } else {
                            effectiveSetCount++;
                            label = `${effectiveSetCount}`;
                            labelColor = "text-gray-400";
                          }

                          const isConverted = set.unit !== displayUnit;
                          const displayWeight = convertWeight(set.weight, set.unit, displayUnit);

                          return (
                            <div 
                              key={set.id} 
                              className="flex items-center text-sm cursor-pointer hover:bg-gray-700/50 p-1 rounded transition-colors"
                              onClick={() => handleEditClick(set)}
                            >
                              <div className={`w-8 text-right mr-3 font-mono font-bold ${labelColor}`}>
                                {label}
                              </div>
                              <div className="flex-1 font-mono text-gray-300 flex items-center flex-wrap">
                                <span className="text-white font-bold mr-1">
                                  {parseFloat(displayWeight.toFixed(2))}
                                  {displayUnit}
                                </span>
                                <span className="text-gray-500 mx-1">x</span>
                                <span>{set.reps}</span>
                                
                                {set.rpe && (
                                  <span className={`ml-2 text-xs font-bold ${set.rpe >= 9 ? 'text-red-400' : set.rpe >= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    @ RPE {set.rpe}
                                  </span>
                                )}
                                
                                {set.isDropSet && (
                                  <span className="ml-2 text-xs text-gray-500 italic border border-gray-700 px-1 rounded">
                                    Drop
                                  </span>
                                )}
                                
                                {isConverted && (
                                  <span className="ml-auto text-xs text-gray-600 pl-2">
                                    ({set.weight}{set.unit})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {!isLoading && historyData.length === 0 && (
          <div className="text-center py-10 text-gray-500 flex flex-col items-center">
            <p className="mb-4">{isFiltering ? "No se encontraron resultados." : "No hay entrenamientos registrados."}</p>
            <button 
              onClick={() => loadData(0, null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recargar
            </button>
          </div>
        )}
      </div>

      {/* footer paginacion manual */}
      {historyData.length > 0 && (
        <div className="flex justify-between items-center mt-6 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <button 
            onClick={handlePrevPage} 
            disabled={page === 0 || isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Anterior
          </button>
          <span className="text-gray-400 font-medium">Página {page + 1}</span>
          <button 
            onClick={handleNextPage} 
            disabled={!cursors[page + 1] || isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Siguiente
          </button>
        </div>
      )}

      <EditSetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveSet} 
        onDelete={handleDeleteSet} 
        initialData={editingSet} 
      />
    </div>
    </div>
  );
};

export default HistoryPage;
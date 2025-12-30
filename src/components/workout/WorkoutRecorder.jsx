import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutBatch, getExerciseStats, getExerciseCatalog, getMuscleGroups } from '../../services/firestore';
import Combobox from '../ui/Combobox';
import StatsPanel from './StatsPanel';
import HelpMarker from '../ui/HelpMarker';

const WorkoutRecorder = () => {
  const { user } = useAuth();
  
  // estado del formulario
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exercise, setExercise] = useState('');
  const [unit, setUnit] = useState('kg');
  const [workoutDate, setWorkoutDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  const [sets, setSets] = useState([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false, isDropSet: false }]);
  
  // estado de datos externos
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState([]);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // cargar grupos musculares usados anteriormente
  useEffect(() => {
    const fetchMuscleGroups = async () => {
      if (user) {
        const groups = await getMuscleGroups(user.uid);
        setAvailableMuscleGroups(groups);
      }
    };
    fetchMuscleGroups();
  }, [user]);

  // cargar catalogo de ejercicios
  useEffect(() => {
    const fetchCatalog = async () => {
      if (user && muscleGroup) {
        const catalog = await getExerciseCatalog(user.uid, muscleGroup);
        setExerciseCatalog(catalog);
      } else {
        setExerciseCatalog([]);
      }
    };
    fetchCatalog();
  }, [user, muscleGroup]);
  
  // cargar estadisticas con debounce
  useEffect(() => {
    const fetchStats = async () => {
      if (user && exercise) {
        setLoadingStats(true);
        try {
          const data = await getExerciseStats(user.uid, exercise);
          setStats(data);
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setLoadingStats(false);
        }
      } else {
        setStats(null);
      }
    };
    
    const timeoutId = setTimeout(fetchStats, 500);
    return () => clearTimeout(timeoutId);
  }, [user, exercise]);

  // manejadores de sets
  const handleSetChange = (id, field, value) => {
    setSets(prevSets => prevSets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const handleAddSet = () => {
    setSets(prev => [...prev, { id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false, isDropSet: false }]);
  };

  const handleRemoveSet = (id) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter(s => s.id !== id));
    }
  };

  // procesamiento de series orden y 1rm
  const processedSets = useMemo(() => {
    let visualCounter = 1;
    let dbCounter = 1;

    return sets.map((set, index) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps, 10) || 0;
      const estimated1RM = weight * (1 + reps / 30);
      
      // regla solo el index 0 puede ser warmup visualmente
      const isWarmup = index === 0 && set.isWarmup;
      
      let displayOrder;
      let setOrder;

      if (isWarmup) {
        displayOrder = 'W';
        setOrder = 0;
      } else {
        setOrder = dbCounter++;
        // si es drop set y no es la primera fila absoluta aunque la regla visual es index > 0
        if (set.isDropSet && index > 0) {
          displayOrder = '↳';
        } else {
          displayOrder = visualCounter++;
        }
      }

      return {
        ...set,
        isWarmup,
        setOrder,
        displayOrder,
        calculated1RM: estimated1RM
      };
    });
  }, [sets]);
  
  const handleSave = async () => {
    if (!muscleGroup || !exercise) {
      alert("Por favor selecciona un grupo muscular y un ejercicio.");
      return;
    }

    const validSets = processedSets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) {
      alert("Completa al menos una serie con peso y repeticiones.");
      return;
    }
    
    const workoutData = {
      userId: user.uid,
      muscleGroup,
      exercise,
      unit,
      sets: validSets,
      date: workoutDate
    };

    try {
      await saveWorkoutBatch(workoutData);
      alert("Entrenamiento guardado exitosamente.");
      // resetear sets
      setSets([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false, isDropSet: false }]);
      // recargar stats
      const newStats = await getExerciseStats(user.uid, exercise);
      setStats(newStats);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Error al guardar el entrenamiento.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* selector de fecha */}
      <div className="flex justify-end">
        <HelpMarker text="Fecha del entrenamiento" className="w-auto">
          <input 
            type="date" 
            value={workoutDate} 
            onChange={(e) => setWorkoutDate(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ colorScheme: 'dark' }}
          />
        </HelpMarker>
      </div>

      {/* selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HelpMarker text="Grupo muscular principal">
          <Combobox
            value={muscleGroup}
            onChange={(val) => { setMuscleGroup(val); setExercise(''); }}
            options={availableMuscleGroups}
            placeholder="Grupo Muscular"
          />
        </HelpMarker>
        <HelpMarker text="Ejercicio">
          <Combobox
            value={exercise}
            onChange={setExercise}
            options={exerciseCatalog}
            placeholder="Ejercicio"
          />
        </HelpMarker>
      </div>

      {/* tabla de series */}
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Series</h2>
          <div className="w-auto">
            <HelpMarker text="Unidad de peso" className="w-auto">
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button onClick={() => setUnit('kg')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unit === 'kg' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>KG</button>
                <button onClick={() => setUnit('lb')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unit === 'lb' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>LB</button>
              </div>
            </HelpMarker>
          </div>
        </div>

        {/* cabeceras */}
        <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
          <div className="col-span-1">#</div>
          <div className="col-span-1">
            <span className="hidden sm:inline">Warmup</span>
            <span className="sm:hidden">W</span>
          </div>
          <div className="col-span-3">Peso <span className="text-gray-600">({unit})</span></div>
          <div className="col-span-2">Reps</div>
          <div className="col-span-2">RPE</div>
          <div className="col-span-2">1RM</div>
          <div className="col-span-1"></div>
        </div>

        {/* filas */}
        <div className="space-y-2">
          {processedSets.map((set, index) => (
            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
              <div className={`col-span-1 text-center font-mono font-bold ${set.displayOrder === 'W' ? 'text-orange-500' : 'text-blue-400'}`}>
                {set.displayOrder}
              </div>
              <div className="col-span-1 flex justify-center">
                {index === 0 ? (
                  <HelpMarker text="Calentamiento" className="flex justify-center">
                    <input type="checkbox" checked={set.isWarmup} onChange={(e) => handleSetChange(set.id, 'isWarmup', e.target.checked)} className="w-5 h-5 rounded border-gray-600 text-blue-600 bg-gray-700" />
                  </HelpMarker>
                ) : (
                  <div className="flex justify-center w-full">
                    {index === 1 ? (
                      <HelpMarker text="Drop Set" className="flex justify-center">
                        <button 
                          onClick={() => handleSetChange(set.id, 'isDropSet', !set.isDropSet)}
                          className={`p-1 rounded-full transition-all ${set.isDropSet ? 'text-blue-400 bg-blue-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'}`}
                          title="Marcar como Drop Set"
                        >
                          {set.isDropSet ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" /></svg>
                          )}
                        </button>
                      </HelpMarker>
                    ) : (
                      <button 
                        onClick={() => handleSetChange(set.id, 'isDropSet', !set.isDropSet)}
                        className={`p-1 rounded-full transition-all ${set.isDropSet ? 'text-blue-400 bg-blue-900/30' : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700'}`}
                      >
                        {set.isDropSet ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c0 0-8.25 6-8.25 12.75a8.25 8.25 0 0 0 16.5 0C20.25 8.25 12 2.25 12 2.25z" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-3">
                {index === 0 ? (
                  <HelpMarker text="Peso">
                    <input type="number" value={set.weight} onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </HelpMarker>
                ) : (
                  <input type="number" value={set.weight} onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
              <div className="col-span-2">
                {index === 0 ? (
                  <HelpMarker text="Reps">
                    <input type="number" value={set.reps} onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </HelpMarker>
                ) : (
                  <input type="number" value={set.reps} onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
              <div className="col-span-2">
                {index === 0 ? (
                  <HelpMarker text="Escala de Esfuerzo (1-10). 10 = Fallo muscular, 8 = 2 reps en reserva." position="bottom">
                    <input type="number" value={set.rpe} onChange={(e) => handleSetChange(set.id, 'rpe', e.target.value)} placeholder="-" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </HelpMarker>
                ) : (
                  <input type="number" value={set.rpe} onChange={(e) => handleSetChange(set.id, 'rpe', e.target.value)} placeholder="-" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
              <div className="col-span-2 text-center font-mono text-gray-300 text-sm">
                {index === 0 ? (
                  <HelpMarker text="Repetición Máxima Estimada. Peso teórico máximo para 1 repetición.">
                    <span>{set.calculated1RM > 0 ? Math.round(set.calculated1RM) : '-'}</span>
                  </HelpMarker>
                ) : (
                  set.calculated1RM > 0 ? Math.round(set.calculated1RM) : '-'
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                {sets.length > 1 && (
                  index === 0 ? (
                    <HelpMarker text="Eliminar serie" className="flex justify-center" position="bottom">
                      <button onClick={() => handleRemoveSet(set.id)} className="text-gray-500 hover:text-red-500">✕</button>
                    </HelpMarker>
                  ) : (
                    <button onClick={() => handleRemoveSet(set.id)} className="text-gray-500 hover:text-red-500">✕</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <HelpMarker text="Añadir nueva serie" position="bottom">
          <button onClick={handleAddSet} className="mt-4 w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all font-medium">+ Agregar Serie</button>
        </HelpMarker>
      </div>

      <HelpMarker text="Guardar este ejercicio" align="right">
        <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">GUARDAR TODO EL EJERCICIO</button>
      </HelpMarker>

      {/* panel de estadisticas */}
      <StatsPanel stats={stats} loading={loadingStats} currentUnit={unit} />
    </div>
  );
};

export default WorkoutRecorder;

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutBatch, getExerciseStats, getExerciseCatalog, getMuscleGroups } from '../../services/firestore';
import Combobox from '../ui/Combobox';
import StatsPanel from './StatsPanel';

const WorkoutRecorder = () => {
  const { user } = useAuth();
  
  // Estado del formulario
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exercise, setExercise] = useState('');
  const [unit, setUnit] = useState('kg');
  const [sets, setSets] = useState([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false }]);
  
  // Estado de datos externos
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState([]);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Cargar grupos musculares usados anteriormente
  useEffect(() => {
    const fetchMuscleGroups = async () => {
      if (user) {
        const groups = await getMuscleGroups(user.uid);
        setAvailableMuscleGroups(groups);
      }
    };
    fetchMuscleGroups();
  }, [user]);

  // Cargar catálogo de ejercicios
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
  
  // Cargar estadísticas con debounce
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

  // Manejadores de sets
  const handleSetChange = (id, field, value) => {
    setSets(prevSets => prevSets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const handleAddSet = () => {
    setSets(prev => [...prev, { id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false }]);
  };

  const handleRemoveSet = (id) => {
    if (sets.length > 1) {
      setSets(prev => prev.filter(s => s.id !== id));
    }
  };

  // Procesamiento de series (Orden y 1RM)
  const processedSets = useMemo(() => {
    let effectiveCounter = 1;
    return sets.map((set, index) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps, 10) || 0;
      const estimated1RM = weight * (1 + reps / 30);
      
      // Regla: Solo el index 0 puede ser warmup visualmente
      const isWarmup = index === 0 && set.isWarmup;
      
      return {
        ...set,
        isWarmup,
        setOrder: isWarmup ? 0 : effectiveCounter++,
        displayOrder: isWarmup ? 'W' : (effectiveCounter - 1),
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
      sets: validSets
    };

    try {
      await saveWorkoutBatch(workoutData);
      alert("Entrenamiento guardado exitosamente.");
      // Resetear sets
      setSets([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false }]);
      // Recargar stats
      const newStats = await getExerciseStats(user.uid, exercise);
      setStats(newStats);
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Error al guardar el entrenamiento.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Combobox
          value={muscleGroup}
          onChange={(val) => { setMuscleGroup(val); setExercise(''); }}
          options={availableMuscleGroups}
          placeholder="Grupo Muscular"
        />
        <Combobox
          value={exercise}
          onChange={setExercise}
          options={exerciseCatalog}
          placeholder="Ejercicio"
        />
      </div>

      {/* Tabla de Series */}
      <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Series</h2>
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button onClick={() => setUnit('kg')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unit === 'kg' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>KG</button>
            <button onClick={() => setUnit('lb')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unit === 'lb' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>LB</button>
          </div>
        </div>

        {/* Cabeceras */}
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

        {/* Filas */}
        <div className="space-y-2">
          {processedSets.map((set, index) => (
            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-center font-mono font-bold text-blue-400">{set.displayOrder}</div>
              <div className="col-span-1 flex justify-center">
                {index === 0 && (
                  <input type="checkbox" checked={set.isWarmup} onChange={(e) => handleSetChange(set.id, 'isWarmup', e.target.checked)} className="w-5 h-5 rounded border-gray-600 text-blue-600 bg-gray-700" />
                )}
              </div>
              <div className="col-span-3"><input type="number" value={set.weight} onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="col-span-2"><input type="number" value={set.reps} onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="col-span-2"><input type="number" value={set.rpe} onChange={(e) => handleSetChange(set.id, 'rpe', e.target.value)} placeholder="-" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-2 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div className="col-span-2 text-center font-mono text-gray-300 text-sm">{set.calculated1RM > 0 ? Math.round(set.calculated1RM) : '-'}</div>
              <div className="col-span-1 flex justify-center">
                {sets.length > 1 && <button onClick={() => handleRemoveSet(set.id)} className="text-gray-500 hover:text-red-500">✕</button>}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleAddSet} className="mt-4 w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all font-medium">+ Agregar Serie</button>
      </div>

      {/* Panel de Estadísticas */}
      <StatsPanel stats={stats} loading={loadingStats} currentUnit={unit} />

      <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">GUARDAR ENTRENAMIENTO</button>
    </div>
  );
};

export default WorkoutRecorder;

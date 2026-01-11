import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveWorkoutBatch, getExerciseCatalog, getMuscleGroups } from '../../services/firestore';
import Combobox from '../ui/Combobox';
import HelpMarker from '../ui/HelpMarker';
import SetRow from './SetRow';
import WorkoutTimer from './WorkoutTimer';

const WorkoutRecorder = ({ 
  date, 
  setDate, 
  onSaveSuccess,
  muscleGroup,
  setMuscleGroup,
  exercise,
  setExercise,
  unit,
  setUnit
}) => {
  const { user } = useAuth();
  
  // estado del formulario
  // workoutDate ahora viene de props (date)
  const [sets, setSets] = useState([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false, isDropSet: false }]);
  
  // estado de datos externos
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState([]);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);

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
    
    const now = new Date();

    const workoutData = {
      userId: user.uid,
      muscleGroup,
      exercise,
      unit,
      sets: validSets,
      date: date,
      dateString: date,
      createdAt: now
    };

    try {
      await saveWorkoutBatch(workoutData);
      alert("Entrenamiento guardado exitosamente.");
      // resetear sets
      setSets([{ id: Date.now(), weight: '', reps: '', rpe: '', isWarmup: false, isDropSet: false }]);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Error al guardar el entrenamiento.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* header: timer y fecha */}
      <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
        <WorkoutTimer userId={user?.uid} date={date} />
        
        <HelpMarker text="Fecha del entrenamiento" className="w-auto">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-700 text-white px-3 h-11 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            style={{ colorScheme: 'dark' }}
          />
        </HelpMarker>
      </div>

      {/* selectores */}
      <HelpMarker text={<>
        Escribe el nombre de un ejercicio y asigna un grupo para categorizar.<br />
        Conforme guardes ejercicios cargaran mientras escribes.
      </>}>
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
      </HelpMarker>

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
            <SetRow
              key={set.id}
              set={set}
              index={index}
              unit={unit}
              onChange={handleSetChange}
              onRemove={handleRemoveSet}
              isMultiple={sets.length > 1}
            />
          ))}
        </div>

        <HelpMarker text="Añadir nueva serie" position="bottom">
          <button onClick={handleAddSet} className="mt-4 w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all font-medium">+ Agregar Serie</button>
        </HelpMarker>
      </div>

      <HelpMarker text="Guardar este ejercicio" align="right">
        <button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95">GUARDAR TODO EL EJERCICIO</button>
      </HelpMarker>
    </div>
  );
};

export default WorkoutRecorder;

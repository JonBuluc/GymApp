import React, { useRef, useState, useEffect } from 'react';
import { downloadAsPNG } from '../../utils/downloadImage';
import MarcaAgua from '../ui/MarcaAgua';
import { getWorkoutSession, updateManualDuration } from '../../services/firestore';
import { Clock } from 'lucide-react';
import EditDurationModal from './EditDurationModal';

const convertWeight = (weight, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'kg' && toUnit === 'lb') return weight * 2.20462;
  if (fromUnit === 'lb' && toUnit === 'kg') return weight / 2.20462;
  return weight;
};

const SessionCard = ({ session, displayUnit = 'kg', onEditSet, onBulkEdit, userName }) => {
  const cardRef = useRef(null);
  const [duration, setDuration] = useState(null);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  // cargar duracion de la sesion
  useEffect(() => {
    const loadDuration = async () => {
      if (session.userId && session.date) {
        const sessionData = await getWorkoutSession(session.userId, session.date);
        if (sessionData) {
          // calcular tiempo total (acumulado + actual si corre)
          let total = sessionData.accumulatedSeconds || 0;
          if (sessionData.status === 'running' && sessionData.startTime) {
            const now = new Date();
            const start = sessionData.startTime.toDate();
            total += Math.floor((now - start) / 1000);
          }
          setDuration(total);
        }
      }
    };
    loadDuration();
  }, [session]);

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
        muscleGroup: set.muscleGroup,
        sets: [],
        volume: 0
      };
      exerciseGroups.push(groupsMap[key]);
    }
    groupsMap[key].sets.push(set);
    
    const w = convertWeight(set.weight, set.unit, displayUnit);
    groupsMap[key].volume += w * set.reps;
  });

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleEditDuration = () => {
    setIsDurationModalOpen(true);
  };

  const handleSaveDuration = async (totalSeconds) => {
    setDuration(totalSeconds);
    await updateManualDuration(session.userId, session.date, totalSeconds);
    setIsDurationModalOpen(false);
  };

  return (
    <div 
      ref={cardRef}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg relative"
    >
      {/* card header */}
      <div className="bg-gray-750 pt-4 px-4 pb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white capitalize">
            {new Date(session.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            <span className="text-gray-500 ml-2 text-sm font-normal">{new Date(session.date + 'T12:00:00').getFullYear()}</span>
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {session.muscleGroups.map(mg => (
              <button 
                key={mg} 
                onClick={() => onBulkEdit && onBulkEdit({
                  type: 'session',
                  targetName: mg,
                  sessionDate: session.date,
                  setIds: session.exercises.filter(ex => ex.muscleGroup === mg).map(ex => ex.id),
                  initialMuscle: ''
                })}
                disabled={!onBulkEdit}
                className={`text-xs rounded-full px-2 py-1 mr-2 text-gray-300 border border-gray-600 uppercase ${onBulkEdit ? 'bg-gray-700 hover:bg-gray-600 transition-colors' : 'bg-gray-700/50 cursor-default'}`}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => downloadAsPNG(cardRef, 'entreno_' + session.date)}
          className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="Descargar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>
      </div>

      {/* duration badge */}
      {duration !== null && duration > 0 && (
        <div className="bg-gray-800 px-4 pb-4 pt-0 flex justify-start">
          <button onClick={handleEditDuration} className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors bg-blue-900/20 px-3 py-1 rounded-full border border-blue-900/50">
            <Clock size={14} />
            {formatDuration(duration)}
          </button>
        </div>
      )}

      {/* metrics */}
      <div className="grid grid-cols-3 divide-x divide-gray-700 border-t border-b border-gray-700 bg-gray-800/50">
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
                <div className="flex items-center gap-2">
                  <h4 
                    className={`text-white font-bold capitalize text-lg ${onBulkEdit ? 'cursor-pointer hover:text-blue-400 transition-colors' : ''}`}
                    onClick={() => onBulkEdit && onBulkEdit({
                      type: 'rename_exercise',
                      targetName: group.name,
                      sessionDate: session.date,
                      setIds: group.sets.map(s => s.id),
                      initialMuscle: group.muscleGroup,
                      initialExercise: group.name
                    })}
                  >
                    {group.name}
                  </h4>
                  
                    <button
                      onClick={() => onBulkEdit && onBulkEdit({
                        type: 'exercise',
                        targetName: group.name,
                        sessionDate: session.date,
                        setIds: group.sets.map(s => s.id),
                        initialMuscle: ''
                      })}
                      disabled={!onBulkEdit}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize border border-gray-600 ${onBulkEdit ? 'bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300' : 'bg-gray-700/50 text-gray-400 cursor-default'}`}
                    >
                      {group.muscleGroup}
                    </button>
                  
                </div>
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
                  const converted1RM = convertWeight(set.estimated1RM, set.unit, displayUnit);

                  return (
                    <div 
                      key={set.id} 
                      className="flex items-center text-sm cursor-pointer hover:bg-gray-700/50 p-1 rounded transition-colors"
                      onClick={() => onEditSet(set)}
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
                        
                        <span className="text-[10px] text-gray-500 ml-2 opacity-70">
                          (1RM: {Math.round(converted1RM)}{displayUnit})
                        </span>
                        
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
      <MarcaAgua userName={userName} />

      <EditDurationModal 
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
        onSave={handleSaveDuration}
        initialSeconds={duration}
      />
    </div>
  );
};

export default SessionCard;
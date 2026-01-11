import React, { useState, useEffect, useRef } from 'react';
import { getWorkoutSession, startWorkoutSession, pauseWorkoutSession, updateManualDuration } from '../../services/firestore';
import { Play, Pause, Edit2, Check, X } from 'lucide-react';

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const WorkoutTimer = ({ userId, date }) => {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('paused'); // 'running' | 'paused'
  const [startTime, setStartTime] = useState(null);
  const [accumulated, setAccumulated] = useState(0);
  
  // estado de edicion manual
  const [isEditing, setIsEditing] = useState(false);
  const [editH, setEditH] = useState(0);
  const [editM, setEditM] = useState(0);
  const [editS, setEditS] = useState(0);

  const intervalRef = useRef(null);

  // cargar estado inicial desde firebase
  useEffect(() => {
    const loadSession = async () => {
      if (!userId || !date) return;
      
      const session = await getWorkoutSession(userId, date);
      
      if (session) {
        let currentAcc = session.accumulatedSeconds || 0;
        let currentStatus = session.status || 'paused';
        let start = session.startTime ? session.startTime.toDate() : null;

        // safety check: si esta corriendo pero es de un dia anterior, pausar automaticamente
        if (currentStatus === 'running' && start) {
          const now = new Date();
          const isSameDay = start.getDate() === now.getDate() && 
                            start.getMonth() === now.getMonth() && 
                            start.getFullYear() === now.getFullYear();
          
          if (!isSameDay) {
            // calcular tiempo hasta el final de ese dia o simplemente pausar con lo que lleva
            // para simplificar, pausamos calculando hasta ahora pero avisamos (o simplemente pausamos)
            const diff = Math.floor((now - start) / 1000);
            // si la diferencia es absurda (> 12h), mejor solo pausar sin sumar locuras, 
            // pero seguiremos la logica estandar: pausar y guardar.
            // el usuario puede editarlo despues si es incorrecto.
            currentAcc += diff;
            currentStatus = 'paused';
            start = null;
            
            // actualizar en db
            await pauseWorkoutSession(userId, date, currentAcc);
          }
        }

        setAccumulated(currentAcc);
        setStatus(currentStatus);
        setStartTime(start);
        
        // calcular segundos visuales iniciales
        if (currentStatus === 'running' && start) {
          const now = new Date();
          const diff = Math.floor((now - start) / 1000);
          setSeconds(currentAcc + diff);
        } else {
          setSeconds(currentAcc);
        }
      } else {
        // reset si no hay sesion (cambio de dia)
        setSeconds(0);
        setStatus('paused');
        setAccumulated(0);
        setStartTime(null);
      }
    };

    loadSession();
  }, [userId, date]);

  // timer interval (solo visual)
  useEffect(() => {
    if (status === 'running' && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        setSeconds(accumulated + diff);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [status, startTime, accumulated]);

  const toggleTimer = async () => {
    if (status === 'paused') {
      // iniciar
      const now = new Date();
      setStartTime(now);
      setStatus('running');
      // db update
      await startWorkoutSession(userId, date);
    } else {
      // pausar
      const now = new Date();
      const diff = Math.floor((now - startTime) / 1000);
      const newAccumulated = accumulated + diff;
      
      setAccumulated(newAccumulated);
      setStatus('paused');
      setStartTime(null);
      setSeconds(newAccumulated); // Sync visual exacto
      
      // db update
      await pauseWorkoutSession(userId, date, newAccumulated);
    }
  };

  const startEditing = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    setEditH(h);
    setEditM(m);
    setEditS(s);
    setIsEditing(true);
    // pausar si estaba corriendo al editar
    if (status === 'running') toggleTimer();
  };

  const saveEdit = async () => {
    const total = (parseInt(editH) || 0) * 3600 + (parseInt(editM) || 0) * 60 + (parseInt(editS) || 0);
    setSeconds(total);
    setAccumulated(total);
    setIsEditing(false);
    await updateManualDuration(userId, date, total);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-gray-800/50 px-2 h-11 rounded-lg border border-gray-700">
        <input 
          type="number" value={editH} onChange={e => setEditH(e.target.value)} 
          className="w-9 h-8 bg-gray-700 text-white text-center rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
          placeholder="HH"
        />
        <span className="text-gray-400">:</span>
        <input 
          type="number" value={editM} onChange={e => setEditM(e.target.value)} 
          className="w-9 h-8 bg-gray-700 text-white text-center rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
          placeholder="MM"
        />
        <span className="text-gray-400">:</span>
        <input 
          type="number" value={editS} onChange={e => setEditS(e.target.value)} 
          className="w-9 h-8 bg-gray-700 text-white text-center rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
          placeholder="SS"
        />
        <button onClick={saveEdit} className="text-green-400 hover:text-green-300 p-1"><Check size={16} /></button>
        <button onClick={() => setIsEditing(false)} className="text-red-400 hover:text-red-300 p-1"><X size={16} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-800/50 px-3 h-11 rounded-lg border border-gray-700">
      <button
        onClick={toggleTimer}
        className={`p-2 rounded-full transition-all ${
          status === 'running' 
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
        }`}
      >
        {status === 'running' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      
      <div 
        className="font-mono text-lg font-bold text-white cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-2 group"
        onClick={startEditing}
        title="Click para editar tiempo manualmente"
      >
        {formatTime(seconds)}
        <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-gray-500" />
      </div>
    </div>
  );
};

export default WorkoutTimer;

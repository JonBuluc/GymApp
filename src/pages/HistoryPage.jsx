import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkoutHistory, getMuscleGroups, getExerciseCatalog, updateWorkoutSet, deleteWorkoutSet } from '../services/firestore';
import Combobox from '../components/ui/Combobox';
import EditSetModal from '../components/workout/EditSetModal';
import SessionCard from '../components/workout/SessionCard';
import BulkEditModal from '../components/workout/BulkEditModal';
import {bulkUpdateMuscleGroup} from '../services/firestore';
import DatePicker from '../components/ui/DatePicker';
import CardioSessionCard from '../components/cardio/CardioSessionCard';
import { obtenerHistorialCardio, obtenerTodoHistorialCardio } from '../services/lecturasCardio';
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
  const [sesionFuerza, setSesionFuerza] = useState([]);
  const [sesionCardio, setSesionCardio] = useState([]);
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
  const [bulkEdit, setBulkEdit] = useState(null); // { type: 'session' | 'exercise', targetName: string, sessionDate: string, setIds: [] }

  const [todosLosCardios, setTodosLosCardios] = useState([]);
  const [cardiosCargados, setCardiosCargados] = useState(false);

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

  const cargarDatos = useCallback(async (indicePagina, cursorUsar) => {
    setIsLoading(true);
    try {
      const filtrosConsulta = {
        date: filterDate,
        muscle: filterMuscle,
        exercise: filterExercise
      };

      const esCursorCardio = cursorUsar && cursorUsar.isFakeCardioCursor;

      const promesaFuerza = esCursorCardio 
        ? Promise.resolve({ sessions: [], lastDoc: null }) 
        : getWorkoutHistory(user.uid, cursorUsar, filtrosConsulta);

      let promesaCardio;
      if (filterDate) {
        promesaCardio = obtenerHistorialCardio(user.uid, filterDate);
      } else {
        if (!cardiosCargados) {
          promesaCardio = obtenerTodoHistorialCardio(user.uid);
        } else {
          promesaCardio = Promise.resolve(todosLosCardios);
        }
      }
      
      const [resultadoFuerza, resultadoCardio] = await Promise.all([promesaFuerza, promesaCardio]);
      const { sessions, lastDoc: siguienteDocumento } = resultadoFuerza;
      
      setSesionFuerza(sessions);
      
      let cardiosParaMostrar = [];
      let nuevoSiguienteDocumento = siguienteDocumento;

      if (filterDate) {
        cardiosParaMostrar = resultadoCardio;
      } else if (filterMuscle !== 'all' || filterExercise !== 'all') {
        cardiosParaMostrar = [];
      } else {
        let cardiosBase = cardiosCargados ? todosLosCardios : resultadoCardio;
        if (!cardiosCargados) {
           setTodosLosCardios(resultadoCardio);
           setCardiosCargados(true);
        }

        const fechaTope = cursorUsar 
          ? (esCursorCardio ? cursorUsar.lastCardioDate : cursorUsar.data().dateString) 
          : null;

        if (sessions.length > 0) {
          const ultimaFecha = sessions[sessions.length - 1].date;
          cardiosParaMostrar = cardiosBase.filter(c => {
             const enRangoSuperior = indicePagina === 0 ? true : (c.fechaString < fechaTope);
             const enRangoInferior = c.fechaString >= ultimaFecha;
             return enRangoSuperior && enRangoInferior;
          });
          
          // si quedan cardios más antiguos pero no hay historial de fuerza, creamos un cursor virtual de cardio
          if (!siguienteDocumento) {
            const cardiosRestantes = cardiosBase.filter(c => c.fechaString < ultimaFecha);
            if (cardiosRestantes.length > 0) {
              nuevoSiguienteDocumento = { isFakeCardioCursor: true, lastCardioDate: ultimaFecha };
            }
          }
        } else {
          // ya no hay historial de fuerza, paginamos exclusivamente usando fechas de cardio
          const cardiosRestantes = cardiosBase.filter(c => {
             return indicePagina === 0 ? true : (c.fechaString < fechaTope);
          });
          
          const fechasUnicas = [...new Set(cardiosRestantes.map(c => c.fechaString))].slice(0, 5);
          cardiosParaMostrar = cardiosRestantes.filter(c => fechasUnicas.includes(c.fechaString));
          
          if (fechasUnicas.length > 0) {
             const ultimaFechaCardio = fechasUnicas[fechasUnicas.length - 1];
             const hayMas = cardiosRestantes.some(c => c.fechaString < ultimaFechaCardio);
             if (hayMas) {
               nuevoSiguienteDocumento = { isFakeCardioCursor: true, lastCardioDate: ultimaFechaCardio };
             }
          }
        }
      }
      
      setSesionCardio(cardiosParaMostrar);

      // guardar el cursor para la siguiente pagina
      setCursors(prev => {
        const nuevosCursores = [...prev];
        nuevosCursores[indicePagina + 1] = nuevoSiguienteDocumento;
        return nuevosCursores;
      });
    } catch (error) {
      console.error("error al cargar el historial", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filterDate, filterMuscle, filterExercise, cardiosCargados, todosLosCardios]);

  // cargar historial cuando cambian los filtros
  useEffect(() => {
    if (user) {
      setPage(0);
      setCursors([null]);
      cargarDatos(0, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterDate, filterMuscle, filterExercise]);

  const handleNextPage = () => {
    const nextPage = page + 1;
    if (cursors[nextPage] !== undefined) {
      setPage(nextPage);
      cargarDatos(nextPage, cursors[nextPage]);
    }
  };

  const handlePrevPage = () => {
    const prevPage = page - 1;
    if (prevPage >= 0) {
      setPage(prevPage);
      cargarDatos(prevPage, cursors[prevPage]);
    }
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
      setSesionFuerza(prevData => {
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
      setSesionFuerza(prevData => {
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

  const handleBulkUpdate = async ({ newMuscle, newExercise, ...data }) => {
  if (!data || !newMuscle) return;
  try {
    if (data.type === 'rename_exercise') {
      if (!newExercise) return;
      
      // actualizar todas las series
      await Promise.all(data.setIds.map(id => 
        updateWorkoutSet(id, { exercise: newExercise, muscleGroup: newMuscle })
      ));

      // actualizacion optimista local
      setSesionFuerza(prev => prev.map(session => {
        if (session.date !== data.sessionDate) return session;
        
        const updatedExercises = session.exercises.map(ex => 
          data.setIds.includes(ex.id) ? { ...ex, exercise: newExercise, muscleGroup: newMuscle } : ex
        );
        return recalculateSession(session, updatedExercises);
      }));
    } else {
      await bulkUpdateMuscleGroup(data.setIds, newMuscle);
      
      // actualizacion optimista local
      setSesionFuerza(prev => prev.map(session => {
        if (session.date !== data.sessionDate) return session;
        
        const updatedExercises = session.exercises.map(ex => 
          data.setIds.includes(ex.id) ? { ...ex, muscleGroup: newMuscle } : ex
        );
        return recalculateSession(session, updatedExercises);
      }));
    }
    
    setBulkEdit(null);
  } catch (error) {
    console.error("error en update masivo:", error);
    alert("error al actualizar los grupos musculares.");
  }
};

  const handleBulkDelete = async (data) => {
    if (!data) return;
    try {
      await Promise.all(data.setIds.map(id => deleteWorkoutSet(id)));
      
      // actualizacion optimista local
      setSesionFuerza(prev => prev.map(session => {
        if (session.date !== data.sessionDate) return session;
        
        const updatedExercises = session.exercises.filter(ex => !data.setIds.includes(ex.id));
        return recalculateSession(session, updatedExercises);
      }).filter(session => session.exercises.length > 0)); // eliminar sesiones vacias

      setBulkEdit(null);
    } catch (error) {
      console.error("error en delete masivo history:", error);
      alert("error al eliminar ejercicios.");
    }
  };

  const handleBulkEditRequest = (editData) => {
    setBulkEdit(editData);
  };

  return (
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
              <DatePicker 
                fechaSeleccionada={filterDate}
                alCambiarFecha={setFilterDate}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-10 text-gray-400 hover:text-white z-10"
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
        {Array.from(new Set([
          ...sesionFuerza.map(sesionUnica => sesionUnica.date),
          ...sesionCardio.map(sesionUnica => sesionUnica.fechaString)
        ])).sort((fechaA, fechaB) => new Date(fechaB) - new Date(fechaA)).map((fechaIterada) => {
          const fuerzaDelDia = sesionFuerza.find(sesionUnica => sesionUnica.date === fechaIterada);
          const cardioDelDia = sesionCardio.filter(sesionUnica => sesionUnica.fechaString === fechaIterada);

          return (
            <div key={fechaIterada} className="space-y-4">
              {fuerzaDelDia && (
                <SessionCard
                  session={fuerzaDelDia}
                  displayUnit={displayUnit}
                  onEditSet={handleEditClick}
                  onBulkEdit={handleBulkEditRequest}
                  userName={user?.displayName || user?.email}
                />
              )}
              {cardioDelDia.length > 0 && (
                <CardioSessionCard
                  sesionesDelDia={cardioDelDia}
                  fechaSesion={fechaIterada}
                  nombreUsuario={user?.displayName || user?.email}
                />
              )}
            </div>
          );
        })}
        
        {!isLoading && sesionFuerza.length === 0 && sesionCardio.length === 0 && (
          <div className="text-center py-10 text-gray-500 flex flex-col items-center">
            <p className="mb-4">{isFiltering ? "no se encontraron resultados." : "no hay entrenamientos en esta fecha."}</p>
            <button 
              onClick={() => cargarDatos(0, null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              recargar
            </button>
          </div>
        )}
      </div>

      {/* footer paginacion manual */}
      {(sesionFuerza.length > 0 || sesionCardio.length > 0) && (
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

      <BulkEditModal 
        isOpen={!!bulkEdit}
        onClose={() => setBulkEdit(null)}
        onSave={handleBulkUpdate}
        onDelete={handleBulkDelete}
        bulkEditData={bulkEdit}
        availableMuscles={availableMuscles}
        user={user}
      />

      <EditSetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveSet} 
        onDelete={handleDeleteSet} 
        initialData={editingSet} 
      />
    </div>
  );
};

export default HistoryPage;
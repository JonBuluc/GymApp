import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsData, getMuscleGroups, getExerciseCatalog } from '../services/firestore';
import MultiSelect from '../components/ui/MultiSelect';
import WeekPicker from '../components/ui/WeekPicker';
import { downloadAsPNG } from '../utils/downloadImage';
import MarcaAgua from '../components/ui/MarcaAgua';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
  '#f97316', '#06b6d4'
];

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-200 font-medium">{entry.name}:</span>
            <span className="text-white font-bold">
              {entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ProgressPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState([]);

  // referencias para exportacion
  const fullPageRef = useRef(null);
  const mainChartRef = useRef(null);
  const weeklyVolumeRef = useRef(null);
  const radarRef = useRef(null);
  const heatmapRef = useRef(null);

  // filtros
  const [dateRangePreset, setDateRangePreset] = useState('3months');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);

  // toggles
  const [unitMode, setUnitMode] = useState('kg'); // 'kg' | 'lb'
  const [metricMode, setMetricMode] = useState('1rm'); // '1rm' | 'max_weight'
  const [radarMetric, setRadarMetric] = useState('sets'); // 'sets' | 'volume'
  const [radarTimeRange, setRadarTimeRange] = useState('month');
  const [tooltipData, setTooltipData] = useState(null);
  const [volumeSelectedDate, setVolumeSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [constancyMonths, setConstancyMonths] = useState([]);

  // opciones
  const [availableMuscles, setAvailableMuscles] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);

  // ref para tracking de ejercicios previos (logica cascada)
  const prevAvailableExercisesRef = useRef([]);

  // actualizar rango de fechas segun preset
  useEffect(() => {
    const end = new Date();
    let start = new Date();

    switch (dateRangePreset) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start = new Date('2020-01-01');
        break;
      default:
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }, [dateRangePreset]);

  // cargar grupos musculares
  useEffect(() => {
    if (user) {
      getMuscleGroups(user.uid).then(groups => {
        setAvailableMuscles(groups);
      });
    }
  }, [user]);

  // cargar ejercicios segun musculos seleccionados
  useEffect(() => {
    const fetchExercises = async () => {
      if (user && selectedMuscles.length > 0) {
        const promises = selectedMuscles.map(m => getExerciseCatalog(user.uid, m));
        const results = await Promise.all(promises);
        // aplanar y unicos (mantener orden de musculos para agrupacion visual)
        const newAvailable = [...new Set(results.flat())];
        
        setAvailableExercises(newAvailable);

        // logica cascada inteligente
        const prevAvailable = prevAvailableExercisesRef.current;
        const added = newAvailable.filter(ex => !prevAvailable.includes(ex));
        
        setSelectedExercises(prevSelected => {
          const kept = prevSelected.filter(ex => newAvailable.includes(ex));
          return [...kept, ...added];
        });
        prevAvailableExercisesRef.current = newAvailable;
      } else {
        setAvailableExercises([]);
      }
    };
    fetchExercises();
  }, [user, selectedMuscles]);

  // cargar data cruda
  useEffect(() => {
    // cargar siempre todo el historial (desde 2020) para que las graficas secundarias no dependan del filtro
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        try {
          const data = await getAnalyticsData(user.uid, '2020-01-01', new Date().toISOString().split('T')[0]);
          setRawData(data);
        } catch (error) {
          console.error("Error loading analytics:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  // calcular meses disponibles para constancia
  const availableMonths = useMemo(() => {
    if (!rawData.length) return [];
    const months = new Set(rawData.map(d => d.dateString.slice(0, 7))); // YYYY-MM
    return Array.from(months).sort().reverse();
  }, [rawData]);

  // inicializar meses seleccionados (ultimos 3)
  useEffect(() => {
    if (availableMonths.length > 0 && constancyMonths.length === 0) {
      setConstancyMonths(availableMonths.slice(0, 3));
    }
  }, [availableMonths]);

  const convertWeight = (weight, from, to) => {
    if (from === to) return weight;
    if (from === 'kg' && to === 'lb') return weight * 2.20462;
    if (from === 'lb' && to === 'kg') return weight / 2.20462;
    return weight;
  };

  const getSunday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    return new Date(date.setDate(date.getDate() - day));
  };

  // procesamiento de datos para la grafica
  const chartData = useMemo(() => {
    if (!rawData.length || selectedExercises.length === 0) return [];

    // filtrar por ejercicios seleccionados
    // Y filtrar por rango de fecha (SOLO afecta a esta grafica)
    const filtered = rawData.filter(d => 
      selectedExercises.includes(d.exercise) &&
      d.dateString >= dateRange.start &&
      d.dateString <= dateRange.end
    );

    // agrupar por fecha
    const groupedByDate = {};

    filtered.forEach(log => {
      const date = log.dateString;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date };
      }

      const weight = parseFloat(log.weight) || 0;
      const reps = parseInt(log.reps, 10) || 0;
      const unit = log.unit;

      // convertir a la unidad visual seleccionada
      const weightInTarget = convertWeight(weight, unit, unitMode);

      let value = 0;
      if (metricMode === '1rm') {
        value = weightInTarget * (1 + reps / 30);
      } else {
        value = weightInTarget;
      }

      // tomar el mejor valor del dia para este ejercicio
      const exercise = log.exercise;
      if (!groupedByDate[date][exercise] || value > groupedByDate[date][exercise]) {
        groupedByDate[date][exercise] = parseFloat(value.toFixed(2));
      }
    });

    return Object.values(groupedByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rawData, selectedExercises, unitMode, metricMode, dateRange]);

  // 1. Volumen Semanal
  const weeklyVolumeData = useMemo(() => {
    const sunday = getSunday(volumeSelectedDate);
    const daysOfWeek = [];
    const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    
    // Generar los 7 días de la semana seleccionada
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      daysOfWeek.push(d.toISOString().split('T')[0]);
    }

    return daysOfWeek.map(dateStr => {
      // Filtrar logs de este día específico
      const dayLogs = rawData.filter(log => log.dateString === dateStr);
      
      const dayVolume = dayLogs.reduce((acc, log) => {
        const weight = parseFloat(log.weight) || 0;
        const reps = parseInt(log.reps, 10) || 0;
        const weightInTarget = convertWeight(weight, log.unit, unitMode);
        return acc + (weightInTarget * reps);
      }, 0);

      return {
        day: WEEKDAYS[new Date(dateStr + 'T12:00:00').getDay()],
        fullDate: dateStr,
        volume: Math.round(dayVolume)
      };
    });
  }, [rawData, volumeSelectedDate, unitMode]);

  // 2. Equilibrio Muscular
  const muscleBalanceData = useMemo(() => {
    if (!rawData.length) return [];
    const grouped = {};
    
    const end = new Date();
    let start = new Date();

    switch (radarTimeRange) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    const startDateStr = start.toISOString().split('T')[0];
    
    rawData.forEach(log => {
      if (log.isWarmup || log.dateString < startDateStr) return;
      const muscle = log.muscleGroup ? log.muscleGroup.charAt(0).toUpperCase() + log.muscleGroup.slice(1) : 'Otros';
      if (!grouped[muscle]) grouped[muscle] = 0;
      
      if (radarMetric === 'sets') {
        grouped[muscle] += 1;
      } else {
        const weight = parseFloat(log.weight) || 0;
        const reps = parseInt(log.reps, 10) || 0;
        const unit = log.unit;
        const weightInTarget = convertWeight(weight, unit, unitMode);
        grouped[muscle] += weightInTarget * reps;
      }
    });

    return Object.keys(grouped).map(key => ({
      subject: key,
      A: Math.round(grouped[key]),
      fullMark: Math.max(...Object.values(grouped))
    }));
  }, [rawData, radarMetric, unitMode, radarTimeRange]);

  // 3. Constancia (Matriz Mensual Partida)
  const matrixData = useMemo(() => {
    // Mapa de datos por dia
    const dayDataMap = {};
    rawData.forEach(log => {
      if (!log.isWarmup) {
        const d = log.dateString;
        if (!dayDataMap[d]) dayDataMap[d] = { count: 0, volume: 0 };
        dayDataMap[d].count += 1;
        
        const weight = parseFloat(log.weight) || 0;
        const reps = parseInt(log.reps, 10) || 0;
        const weightInTarget = convertWeight(weight, log.unit, unitMode);
        dayDataMap[d].volume += weightInTarget * reps;
      }
    });

    // Ordenar meses seleccionados cronologicamente
    const sortedMonths = [...constancyMonths].sort();

    return sortedMonths.map(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Generar 16 filas
      const rows = [];
      for (let i = 0; i < 16; i++) {
        // Columna A: Dia 1-15
        const dayA = i + 1;
        let cellA = null;
        if (dayA <= 15) {
          const dateStrA = `${monthStr}-${String(dayA).padStart(2, '0')}`;
          cellA = {
            date: dateStrA,
            day: dayA,
            ...dayDataMap[dateStrA] || { count: 0, volume: 0 }
          };
        }

        // Columna B: Dia 16-31
        const dayB = i + 16;
        let cellB = null;
        if (dayB <= daysInMonth) {
          const dateStrB = `${monthStr}-${String(dayB).padStart(2, '0')}`;
          cellB = {
            date: dateStrB,
            day: dayB,
            ...dayDataMap[dateStrB] || { count: 0, volume: 0 }
          };
        }

        rows.push({ cellA, cellB });
      }

      return {
        monthLabel: new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        monthStr,
        rows
      };
    });
  }, [rawData, constancyMonths, unitMode]);

  // calcular valor maximo de series para el gradiente de color
  const maxIntensity = useMemo(() => {
    let max = 0;
    matrixData.forEach(month => {
      month.rows.forEach(row => {
        if (row.cellA?.count > max) max = row.cellA.count;
        if (row.cellB?.count > max) max = row.cellB.count;
      });
    });
    return max || 1; // evitar division por cero
  }, [matrixData]);

  const handleDayHover = (e, day) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipData({
      x: rect.left + rect.width / 2,
      y: rect.top - 5,
      ...day
    });
  };

  return (
      <div ref={fullPageRef} className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
        {/* header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-white pt-[2px]">Progreso</h1>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => downloadAsPNG(fullPageRef, 'dashboard_completo')}
              className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors border border-gray-700"
              title="Descargar Dashboard Completo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </button>
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button onClick={() => setUnitMode('kg')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unitMode === 'kg' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>KG</button>
              <button onClick={() => setUnitMode('lb')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${unitMode === 'lb' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>LB</button>
            </div>
          </div>
        </div>

        {/* filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="week">Última Semana</option>
              <option value="month">Último Mes</option>
              <option value="3months">Últimos 3 Meses</option>
              <option value="year">Último Año</option>
              <option value="all">Todo el Historial</option>
            </select>
          </div>
          <MultiSelect options={availableMuscles} selected={selectedMuscles} onChange={setSelectedMuscles} placeholder="Músculos..." />
          <MultiSelect options={availableExercises} selected={selectedExercises} onChange={setSelectedExercises} placeholder="Ejercicios..." />
        </div>

        {/* grafica */}
        <div ref={mainChartRef} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-300 leading-none pt-[2px]">Evolución de Cargas</h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button onClick={() => setMetricMode('1rm')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${metricMode === '1rm' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>1RM Estimado</button>
                <button onClick={() => setMetricMode('max_weight')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${metricMode === 'max_weight' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Peso Máximo</button>
              </div>
              <button 
                onClick={() => downloadAsPNG(mainChartRef, 'evolucion_cargas')}
                className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
                title="Descargar gráfica"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cambia el valor dentro de los corchetes [] para ajustar la altura (ej: h-[600px]) */}
          <div className="h-[400px] md:h-[550px] w-full overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Cargando datos...</div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12 }} 
                  unit={unitMode} 
                  width={80}
                />
                <Tooltip content={<CustomTooltip unit={unitMode} />} />
                {selectedExercises.map((ex, idx) => (
                  <Line key={ex} type="monotone" dataKey={ex} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">Selecciona ejercicios para ver el progreso</div>
          )}
          </div>

          {/* Leyenda externa para garantizar que el area de dibujo de la grafica sea fija */}
          {chartData.length > 0 && !loading && (
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-gray-700 pt-6">
              {selectedExercises.map((ex, idx) => (
                <div key={ex} className="flex items-center gap-2">
                  <div className="w-3 h-1 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-gray-400 font-medium capitalize">{ex}</span>
                </div>
              ))}
            </div>
          )}
          <MarcaAgua userName={user?.displayName || user?.email} />
        </div>

        {/* Gráficas Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Volumen Semanal */}
          <div ref={weeklyVolumeRef} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg h-[350px] md:h-[400px] flex flex-col relative">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-300 pt-[2px]">Volumen Semanal</h3>
              <div className="flex items-center gap-2">
                <WeekPicker 
                  selectedDate={volumeSelectedDate}
                  onChange={(date) => setVolumeSelectedDate(date.toISOString().split('T')[0])}
                />
                <button 
                  onClick={() => downloadAsPNG(weeklyVolumeRef, 'volumen_semanal')}
                  className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
                  title="Descargar gráfica"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 12, capitalize: 'true' }} 
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const dateStr = payload[0].payload.fullDate;
                      return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                    }
                    return label;
                  }}
                />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
            <MarcaAgua userName={user?.displayName || user?.email} />
          </div>

          {/* Equilibrio Muscular */}
          <div ref={radarRef} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg h-[350px] md:h-[400px] flex flex-col relative">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-300 pt-[2px]">Equilibrio Muscular</h3>
              <div className="flex gap-2 items-center">
                <select
                  value={radarTimeRange}
                  onChange={(e) => setRadarTimeRange(e.target.value)}
                  className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none"
                >
                  <option value="week">1 Sem</option>
                  <option value="month">1 Mes</option>
                  <option value="3months">3 Meses</option>
                  <option value="year">1 Año</option>
                </select>
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button 
                    onClick={() => setRadarMetric('sets')} 
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${radarMetric === 'sets' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Series
                  </button>
                  <button 
                    onClick={() => setRadarMetric('volume')} 
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${radarMetric === 'volume' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Volumen
                  </button>
                </div>
                <button 
                  onClick={() => downloadAsPNG(radarRef, 'equilibrio_muscular')}
                  className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
                  title="Descargar gráfica"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={muscleBalanceData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                  name={radarMetric === 'sets' ? "Series" : `Volumen (${unitMode})`}
                  dataKey="A"
                  stroke={radarMetric === 'sets' ? "#10b981" : "#3b82f6"}
                  fill={radarMetric === 'sets' ? "#10b981" : "#3b82f6"}
                  fillOpacity={0.5}
                />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
            </div>
            <MarcaAgua userName={user?.displayName || user?.email} />
          </div>
        </div>

        {/* Constancia (Matriz Mensual Partida) */}
        <div ref={heatmapRef} className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-gray-300 pt-[2px]">Constancia Mensual</h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-72">
                <MultiSelect 
                  options={availableMonths} 
                  selected={constancyMonths} 
                  onChange={setConstancyMonths} 
                  placeholder="Seleccionar Meses..." 
                />
              </div>
              <button 
                onClick={() => downloadAsPNG(heatmapRef, 'constancia_mensual')}
                className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors"
                title="Descargar gráfica"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max">
              {/* Columna de Etiquetas de Fila */}
              <div className="flex flex-col mr-2">
                <div className="h-6 mb-1" /> {/* Espaciador Header alineado con meses */}
                <div className="flex flex-col gap-[2px]">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-7 w-8 flex items-center justify-end text-[10px] text-gray-500 font-mono leading-none">
                      {i === 15 ? '31' : `${i + 1}/${i + 16}`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Columnas de Meses */}
              {matrixData.map((monthData, mIdx) => (
                <div key={monthData.monthStr} className={`flex flex-col ${mIdx !== matrixData.length - 1 ? 'mr-2' : ''}`}>
                  <div className="h-6 text-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter px-1 mb-1 leading-none flex items-center justify-center">
                    {monthData.monthStr.split('-')[0].slice(-2)}-{monthData.monthStr.split('-')[1]}
                  </div>
                  <div className="grid grid-cols-2 gap-[2px]">
                    {monthData.rows.map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {/* Celda A (1-15) */}
                        <div 
                          className={`w-7 rounded-sm cursor-pointer hover:ring-1 hover:ring-white/30 transition-all duration-200 ${!row.cellA ? 'opacity-0 pointer-events-none' : row.cellA.count === 0 ? 'bg-gray-700/40' : ''}`}
                          style={{ 
                            aspectRatio: '1/1',
                            backgroundColor: row.cellA?.count > 0 
                              ? `hsl(210, 85%, ${85 - (Math.min(row.cellA.count / maxIntensity, 1) * 50)}%)` 
                              : undefined
                          }}
                          onMouseEnter={(e) => row.cellA && handleDayHover(e, row.cellA)}
                          onMouseLeave={() => setTooltipData(null)}
                        />
                        
                        {/* Celda B (16-31) */}
                        <div 
                          className={`w-7 rounded-sm cursor-pointer hover:ring-1 hover:ring-white/30 transition-all duration-200 ${!row.cellB ? 'opacity-0 pointer-events-none' : row.cellB.count === 0 ? 'bg-gray-700/40' : ''}`}
                          style={{ 
                            aspectRatio: '1/1',
                            backgroundColor: row.cellB?.count > 0 
                              ? `hsl(210, 85%, ${85 - (Math.min(row.cellB.count / maxIntensity, 1) * 50)}%)` 
                              : undefined
                          }}
                          onMouseEnter={(e) => row.cellB && handleDayHover(e, row.cellB)}
                          onMouseLeave={() => setTooltipData(null)}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MarcaAgua userName={user?.displayName || user?.email} />
        </div>

        {/* Tooltip Personalizado */}
        {tooltipData && (
          <div 
            className="fixed z-50 bg-black/90 text-white text-xs p-2 rounded pointer-events-none transform -translate-x-1/2 -translate-y-full shadow-xl border border-gray-700 whitespace-nowrap"
            style={{ left: tooltipData.x, top: tooltipData.y }}
          >
            <div className="font-bold mb-1 border-b border-gray-700 pb-1 text-center">
              {new Date(tooltipData.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Series:</span>
              <span className="font-mono font-bold">{tooltipData.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Volumen:</span>
              <span className="font-mono font-bold">{Math.round(tooltipData.volume).toLocaleString()} {unitMode}</span>
            </div>
          </div>
        )}
        <MarcaAgua userName={user?.displayName || user?.email} />
      </div>
  );
};

export default ProgressPage;
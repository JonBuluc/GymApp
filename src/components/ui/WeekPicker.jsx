import React, { useState, useRef, useEffect } from 'react';

const WeekPicker = ({ selectedDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  // normalizar fecha de entrada
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate + 'T12:00:00');
  const [viewDate, setViewDate] = useState(new Date(dateObj));
  const [hoveredWeek, setHoveredWeek] = useState(null);
  const containerRef = useRef(null);

  // helper para obtener rango domingo a sabado
  const getWeekRange = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const isInRange = (date, start, end) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  };

  const currentWeek = getWeekRange(dateObj);

  // cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // encontrar el primer domingo de la cuadricula
    const firstOfMonth = new Date(year, month, 1);
    const startOfGrid = new Date(firstOfMonth);
    startOfGrid.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    const days = [];
    const tempDate = new Date(startOfGrid);

    // renderizar 6 semanas fijas (42 dias)
    for (let i = 0; i < 42; i++) {
      const date = new Date(tempDate);
      const isCurrentMonth = date.getMonth() === month;
      const { start, end } = getWeekRange(date);
      
      const isSelected = isInRange(date, currentWeek.start, currentWeek.end);
      const isHovered = hoveredWeek && isInRange(date, hoveredWeek.start, hoveredWeek.end);
      
      const isStartOfWeek = date.getDay() === 0;
      const isEndOfWeek = date.getDay() === 6;

      days.push(
        <div
          key={date.toISOString()}
          onMouseEnter={() => setHoveredWeek({ start, end })}
          onMouseLeave={() => setHoveredWeek(null)}
          onClick={() => {
            onChange(date);
            setIsOpen(false);
          }}
          className={`h-10 flex items-center justify-center cursor-pointer text-sm transition-colors
            ${isSelected ? 'bg-blue-600 text-white' : ''}
            ${!isSelected && isHovered ? 'bg-blue-900/50 text-blue-200' : ''}
            ${!isSelected && !isHovered ? (isCurrentMonth ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-700') : ''}
            ${isStartOfWeek ? 'rounded-l-lg' : ''}
            ${isEndOfWeek ? 'rounded-r-lg' : ''}
          `}
        >
          {date.getDate()}
        </div>
      );
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const formatWeekStart = (range) => {
    const options = { day: 'numeric', month: 'short' };
    return range.start.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 text-white text-xs px-3 py-2 rounded border border-gray-600 cursor-pointer flex items-center gap-2 hover:border-blue-500 transition-colors h-[34px]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium whitespace-nowrap">Semana del {formatWeekStart(currentWeek)}</span>
      </div>

      {/* popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 p-4 w-[300px]">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h4 className="text-white font-bold capitalize">
              {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h4>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0 mb-2">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
              <div key={d} className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekPicker;
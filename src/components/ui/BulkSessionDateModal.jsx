import React, { useState } from 'react';
import { Calendar, Trash2, X } from 'lucide-react';

const BulkSessionDateModal = ({ isOpen, onClose, onSave, onDelete, date, sessionType }) => {
  const [prevDate, setPrevDate] = useState(date);
  const [newDate, setNewDate] = useState(date || '');
  const [viewDate, setViewDate] = useState(() => new Date((date || new Date().toISOString().split('T')[0]) + 'T12:00:00'));

  if (date !== prevDate) {
    setPrevDate(date);
    setNewDate(date || '');
    setViewDate(new Date((date || new Date().toISOString().split('T')[0]) + 'T12:00:00'));
  }

  if (!isOpen) return null;

  // Lógica de fechas (local a zona horaria del usuario)
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (d) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d) => {
    return formatLocalDate(d) === newDate;
  };

  const changeMonth = (offset) => {
    const next = new Date(viewDate);
    next.setMonth(viewDate.getMonth() + offset);
    setViewDate(next);
  };

  const selectDay = (d) => {
    setNewDate(formatLocalDate(d));
  };

  const handleSave = () => {
    if (!newDate) return;
    if (newDate === date) {
      onClose();
      return;
    }
    onSave(sessionType, date, newDate);
  };

  const handleDelete = () => {
    const sessionLabel = sessionType === 'workout' ? 'Entrenamiento' : 'Cardio';
    if (window.confirm(`¿Estás seguro de eliminar todo el ${sessionLabel} del día ${date}? Esta acción borrará permanentemente todos los registros relacionados y no se puede deshacer.`)) {
      onDelete(sessionType, date);
    }
  };

  // Generar cuadrícula de calendario
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startGrid = new Date(firstDay);
  startGrid.setDate(firstDay.getDate() - firstDay.getDay());

  const days = [];
  const temp = new Date(startGrid);
  for (let i = 0; i < 42; i++) {
    const curr = new Date(temp);
    const inCurrentMonth = curr.getMonth() === month;
    const today = isToday(curr);
    const selected = isSelected(curr);

    let className = "h-9 w-9 flex items-center justify-center cursor-pointer text-xs transition-colors rounded-lg font-medium mx-auto";
    if (selected) {
      className += " bg-blue-600 text-white shadow-md font-bold";
    } else if (today) {
      className += " bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30";
    } else if (inCurrentMonth) {
      className += " text-gray-200 hover:bg-gray-700";
    } else {
      className += " text-gray-600 hover:bg-gray-800/50";
    }

    days.push(
      <div key={curr.toISOString()} onClick={() => selectDay(curr)} className={className}>
        {curr.getDate()}
      </div>
    );
    temp.setDate(temp.getDate() + 1);
  }

  const weekdayNames = ["do", "lu", "ma", "mi", "ju", "vi", "sa"];
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const typeName = sessionType === 'workout' ? 'Entrenamiento' : 'Cardio';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700 overflow-hidden transform transition-all flex flex-col">
        {/* Header */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wide">
              Administrar Sesión
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {typeName} — {date}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Seleccionar Nueva Fecha
          </label>
          <div className="bg-gray-900/40 border border-gray-700/60 rounded-xl p-3">
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                &larr;
              </button>
              <div className="text-white font-semibold capitalize text-sm">
                {monthNames[month]} {year}
              </div>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors focus:outline-none"
              >
                &rarr;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 mb-1 text-center">
              {weekdayNames.map((n) => (
                <div key={n} className="text-[10px] font-bold text-gray-500 uppercase">
                  {n}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {days}
            </div>
          </div>

          <div className="mt-3 text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-1.5 bg-gray-900/20 py-1.5 rounded-lg border border-gray-700/30">
            <Calendar size={14} className="text-blue-400" />
            <span>Fecha destino:</span>
            <span className="text-blue-400 font-bold">{newDate}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-900/30 border-t border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            disabled={!newDate || newDate === date}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            Guardar Nueva Fecha
          </button>
          
          <button
            onClick={handleDelete}
            className="w-full bg-red-900/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Eliminar Sesión Completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSessionDateModal;

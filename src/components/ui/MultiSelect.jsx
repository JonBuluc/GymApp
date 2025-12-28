import React, { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ options = [], selected = [], onChange, placeholder = "Seleccionar..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const toggleOption = (option) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const removeChip = (e, option) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* trigger input area */}
      <div
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-[42px] flex items-center cursor-pointer overflow-hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-nowrap gap-2 overflow-x-auto items-center scrollbar-hide h-full">
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; touch-action: pan-x; }`}</style>
          {selected.length === 0 ? (
            <span className="text-gray-400 whitespace-nowrap">{placeholder}</span>
          ) : (
            selected.map(item => (
              <span key={item} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                {item}
                <button
                  onClick={(e) => removeChip(e, item)}
                  className="hover:text-red-200 focus:outline-none font-bold"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        
        <div className="flex-shrink-0 ml-2 text-gray-400 flex items-center pointer-events-none">
           <svg 
             xmlns="http://www.w3.org/2000/svg" 
             className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
             viewBox="0 0 20 20" 
             fill="currentColor"
           >
             <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
        </div>
      </div>

      {/* dropdown list */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option}
                className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700/50 last:border-0"
                onClick={() => toggleOption(option)}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'bg-gray-700 border-gray-500'}`}>
                  {selected.includes(option) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-200">{option}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No hay opciones disponibles</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
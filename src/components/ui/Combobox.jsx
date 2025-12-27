import React, { useState, useEffect, useRef, useMemo } from "react";

const Combobox = ({ value, onChange, options = [], placeholder }) => {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (query === "") return options;
    return options.filter((option) =>
      option.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    setQuery(option);
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-colors"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.map((option, idx) => (
            <li
              key={idx}
              className="px-4 py-2 text-gray-200 hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Combobox;

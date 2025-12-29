import React from 'react';
import { useHelp } from '../../context/HelpContext';

const HelpMarker = ({ text, children, className = "w-full", position = "top", align = "center" }) => {
  const { isHelpActive } = useHelp();

  // Logic for tooltip positioning
  const getTooltipClasses = () => {
    let classes = "absolute transform bg-blue-500 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in duration-200";
    
    // Vertical
    if (position === 'bottom') classes += " top-full mt-2";
    else classes += " -top-2 -translate-y-full mb-1";

    // Horizontal
    if (align === 'left') classes += " left-0";
    else if (align === 'right') classes += " right-0";
    else classes += " left-1/2 -translate-x-1/2"; // center

    return classes;
  };

  // Logic for arrow positioning
  const getArrowClasses = () => {
    let classes = "absolute border-4 border-transparent";
    
    // Vertical
    if (position === 'bottom') classes += " bottom-full border-b-blue-500";
    else classes += " top-full border-t-blue-500";

    // Horizontal
    if (align === 'left') classes += " left-4";
    else if (align === 'right') classes += " right-4";
    else classes += " left-1/2 -translate-x-1/2"; // center

    return classes;
  };

  return (
    <div className={`relative ${className} ${isHelpActive ? 'z-50' : ''}`}>
      {children}
      {isHelpActive && (
        <div className={getTooltipClasses()}>
          {text}
          <div className={getArrowClasses()}></div>
        </div>
      )}
    </div>
  );
};

export default HelpMarker;
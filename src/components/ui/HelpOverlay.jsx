import React from 'react';

const HelpOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* capa de fondo para modo ayuda */}
    </div>
  );
};

export default HelpOverlay;
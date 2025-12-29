import React, { createContext, useState, useContext } from 'react';

const HelpContext = createContext();

export const HelpProvider = ({ children }) => {
  const [isHelpActive, setIsHelpActive] = useState(false);

  const toggleHelp = () => setIsHelpActive(prev => !prev);

  return (
    <HelpContext.Provider value={{ isHelpActive, setIsHelpActive, toggleHelp }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => useContext(HelpContext);
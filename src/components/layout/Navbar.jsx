import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Registrar
            </Link>
            <Link 
              to="/history" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/history') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Historial
            </Link>
          </div>
          <div className="text-white font-bold text-lg hidden sm:block">Gym App</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
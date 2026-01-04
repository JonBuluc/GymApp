import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHelp } from '../../context/HelpContext';
import EditProfileModal from '../../services/EditProfileModal';
import Logo from '../../assets/Logo.svg';
import HelpOverlay from './HelpOverlay';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isHelpActive, toggleHelp, setIsHelpActive } = useHelp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const navLinks = [
    { name: 'Registrar', path: '/' },
    { name: 'Historial', path: '/historial' },
    { name: 'Progreso', path: '/progreso' },
    { name: 'Importar/Exportar', path: '/importar' },
    { name: 'Acerca de', path: '/info' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 flex justify-between items-center h-16 px-4 bg-gray-900 border-b border-gray-800 z-40 shadow-md">
        {/* Izquierda: Hamburguesa */}
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Centro: Logo */}
        <div className="flex items-center text-white font-bold tracking-wider text-xl">
          <img src={Logo} alt="RegiTreno Logo" className="h-8 w-8 mr-2" />
          Regi<span className="text-blue-500">Treno</span>
        </div>

        {/* Derecha: Usuario */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHelp}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full"
            title="Ayuda"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17.25h.008v.008H12v-.008z" />
            </svg>
          </button>

          <div className="relative">
          <button 
            onClick={toggleUserMenu}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-800 border border-gray-700 text-blue-400 font-bold hover:border-blue-500 transition-all"
            aria-haspopup="true"
            aria-expanded={isUserMenuOpen}
          >
            {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
              <div 
                className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in duration-150"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-gray-800">
                  <p className="text-xs text-gray-500 truncate">Conectado como</p>
                  <p className="text-sm text-white font-medium truncate">{user?.displayName || 'Usuario'}</p>
                </div>
                
                <button 
                  onClick={() => {
                    setIsEditProfileModalOpen(true);
                    setIsUserMenuOpen(false);
                  }}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar Alias
                </button>

                <div className="border-t border-gray-800 my-1"></div>

                <button 
                  onClick={logout}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </nav>

      {/* Sidebar / Drawer */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      >
        <aside 
          className={`fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[60] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <span className="text-white font-bold text-lg">Menú</span>
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={toggleSidebar}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-all font-medium"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 w-full p-6 border-t border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-white text-sm font-medium truncate">{user?.displayName || 'Usuario'}</span>
                <span className="text-gray-500 text-xs truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* overlay de ayuda */}
      <HelpOverlay 
        isOpen={isHelpActive} 
        onClose={() => setIsHelpActive(false)} 
      />

      {/* Modal de Edición */}
      <EditProfileModal 
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentUser={user}
      />
    </>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';

const InfoPage = () => {
  const [commits, setCommits] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    // clave para guardar en cache de sesion
    const CACHE_KEY = 'regitreno_commits_cache';
    const cachedData = sessionStorage.getItem(CACHE_KEY);

    if (cachedData) {
      // si ya existen datos en cache, usarlos y no llamar a la api
      setCommits(JSON.parse(cachedData));
    } else {
      // obtener ultimos commits de github
      fetch('https://api.github.com/repos/JonBuluc/GymApp/commits?per_page=15')
        .then(res => {
          if (!res.ok) throw new Error('error en la respuesta de la api');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setCommits(data);
            // guardar en sessionstorage para evitar limites de api
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          }
        })
        .catch(err => {
          console.error("error cargando commits:", err);
          setError(true);
        });
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
      `}</style>
      
      {/* header */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg text-center">
        <div className="flex justify-center items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">Acerca de RegiTreno</h1>
          <span className="bg-blue-900 text-blue-200 text-xs font-mono px-2 py-0.5 rounded-full border border-blue-700">
            v{'1.0.0'}
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          Tu compañero de entrenamiento minimalista y efectivo.
        </p>
        {/* enlace al sitio web oficial (preparado para cuando tengas el dominio) */}
        <a 
          href="https://regitreno.mx" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-400 hover:border-blue-300 pb-0.5"
        >
          Visitar sitio oficial →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* contacto */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-400 mb-4">Contacto y Sugerencias</h2>
            <p className="text-gray-300 mb-2 text-sm">
              ¿Tienes ideas para mejorar la app o encontraste un error? escríbeme:
            </p>
            <a href="mailto:jonan.gomez.mendoza@gmail.com" className="text-base font-bold text-white mb-1 hover:text-blue-400 transition-colors block break-words">
              jonan.gomez.mendoza@gmail.com
            </a>
            <p className="text-gray-400 text-sm mb-4 mt-2">Jon Buluc</p>
          </div>
          <div className="text-xs text-gray-500">Fundador & Creador</div>
        </div>

        {/* repositorio */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-purple-400">Código Fuente</h2>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-600 px-2 py-1 rounded">Licencia MIT</span>
            </div>
            <p className="text-gray-300 mb-4 text-sm">
              Proyecto open source. Revisa el repositorio para ver cómo se manejan tus datos o para desplegar tu propia instancia.
            </p>
          </div>
          <a 
            href="https://github.com/JonBuluc/GymApp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg text-center transition-colors font-mono text-sm border border-gray-600 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            github.com/JonBuluc/GymApp
          </a>
        </div>
      </div>

      {/* ultimos cambios */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Historial de Cambios</h2>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {error ? (
            <p className="text-red-400 text-sm italic text-center py-4">no se pudo cargar el historial de github.</p>
          ) : commits.length > 0 ? (
            commits.map((commit) => (
              <div key={commit.sha} className="border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                <p className="text-gray-200 text-sm font-medium">
                  {commit.commit.message.split('\n')[0]}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(commit.commit.author.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline font-mono">
                    {commit.sha.substring(0, 7)}
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic text-center py-4">conectando con github...</p>
          )}
        </div>
      </div>

      {/* tecnologias */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-xl font-bold text-green-400 mb-6">Tecnologías</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['React', 'Vite', 'Firebase', 'Tailwind CSS', 'Recharts'].map((tech) => (
            <div key={tech} className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-center transition-transform hover:scale-105">
              <span className="text-gray-200 font-medium text-sm">{tech}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
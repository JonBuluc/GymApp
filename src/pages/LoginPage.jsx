import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../services/auth';

const LoginPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Gym App</h1>
        <p className="text-gray-400 mb-8">registra tu progreso.</p>
        <button
          onClick={loginWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
        >
          iniciar sesion con google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;

import React from "react";
import WorkoutRecorder from "../components/workout/WorkoutRecorder";
import { logout } from "../services/auth";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">GYM APP</h1>
          
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Salir ({user?.displayName?.split(" ")[0] || "Usuario"})
          </button>
        </div>
      </header>

      {/* main content */}
      <main className="py-6">
        <WorkoutRecorder />
      </main>
    </div>
  );
};

export default Dashboard;

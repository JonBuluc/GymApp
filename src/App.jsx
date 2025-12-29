import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { HelpProvider } from "./context/HelpContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/ui/Navbar";
import HistoryPage from "./pages/HistoryPage";
import ProgressPage from "./pages/ProgressPage";

function App() {
  return (
    <AuthProvider>
      <HelpProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historial" 
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progreso" 
                element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
      </HelpProvider>
    </AuthProvider>
  );
}

export default App;
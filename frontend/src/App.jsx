
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courts from "./pages/Courts";
import Tournaments from "./pages/Tournaments";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";

import Dashboard from "./pages/Dashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import UnifiedStaffPanel from "./pages/UnifiedStaffPanel";


// Protected Route
function ProtectedRoute({ children, requireAdmin = false, requireCoach = false }) {
  const { isAuthenticated, loading, isAdmin, isCoach } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/player-dashboard" replace />;
  }

  if (requireCoach && !isCoach && !isAdmin) {
    return <Navigate to="/player-dashboard" replace />;
  }

  return children;
}


function AppRoutes() {
  const { loading, isAdmin, isCoach } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
      </div>
    );
  }

  const getDefaultDashboard = () => {
    if (isAdmin || isCoach) return <UnifiedStaffPanel />;
    return <PlayerDashboard />;
  };

  return (
    <div className="min-h-screen flex flex-col">

      <Navbar />

      <main className="flex-1">

        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/courts" element={<Courts />} />

          <Route path="/tournaments" element={<Tournaments />} />

          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {getDefaultDashboard()}
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff-panel"
            element={
              <ProtectedRoute requireCoach>
                <UnifiedStaffPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/player-dashboard"
            element={
              <ProtectedRoute>
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>

      </main>

    </div>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

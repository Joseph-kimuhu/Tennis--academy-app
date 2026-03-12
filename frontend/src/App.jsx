
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Courts from "./pages/Courts";
import Tournaments from "./pages/Tournaments";
import Profile from "./pages/Profile";

import PlayerDashboard from "./pages/PlayerDashboard";
import UnifiedStaffPanel from "./pages/UnifiedStaffPanel";
import RoleConverter from "./components/RoleConverter";
import UserVerifier from "./components/UserVerifier";
import CreateJohnMakumi from "./components/CreateJohnMakumi";


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

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
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

          {/* Temporary role converter route - remove after use */}
          <Route
            path="/convert-roles"
            element={
              <ProtectedRoute requireAdmin>
                <RoleConverter />
              </ProtectedRoute>
            }
          />

          {/* User verifier route - remove after use */}
          <Route
            path="/verify-users"
            element={
              <ProtectedRoute requireAdmin>
                <UserVerifier />
              </ProtectedRoute>
            }
          />

          {/* Create John Makumi route - remove after use */}
          <Route
            path="/create-john"
            element={
              <ProtectedRoute requireAdmin>
                <CreateJohnMakumi />
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

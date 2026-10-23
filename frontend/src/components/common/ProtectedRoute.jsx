import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono">Authenticating session...</p>
      </div>
    );
  }

  // Agar user logged in nahi hai, toh seedha /login par bounce karo
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
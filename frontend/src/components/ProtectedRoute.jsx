import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="theme-loading-screen">
        <div className="theme-loading-content">
          <div className="theme-loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but keep the current path they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

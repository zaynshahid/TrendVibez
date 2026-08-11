import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="theme-loading-screen">
        <div className="theme-loading-content">
          <div className="theme-loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    // Redirect to home if they are not an admin
    return <Navigate to="/" replace />;
  }

  return children;
}

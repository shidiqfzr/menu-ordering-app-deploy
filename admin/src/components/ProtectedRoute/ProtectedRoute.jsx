import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loadingAuth, role } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner"></div>
        <p>Memverifikasi sesi administrator...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedRole = (role === 'admin') ? 'manager' : role;
    const normalizedAllowed = allowedRoles.map(r => (r === 'admin') ? 'manager' : r);

    if (!normalizedAllowed.includes(normalizedRole)) {
      return <Navigate to="/orders" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

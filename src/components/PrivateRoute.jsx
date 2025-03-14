import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ component: Component, requiredRole }) => {
  const { user, role } = useAuth();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // For admin role, allow access to everything
  if (role === 'admin') {
    return <Component />;
  }

  // For viewer role
  if (role === 'viewer') {
    // If trying to access a route that requires admin role
    if (requiredRole === 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    // Allow access to dashboard
    return <Component />;
  }

  // Default: redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default PrivateRoute;

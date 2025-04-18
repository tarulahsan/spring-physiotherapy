import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ component: Component, requiredRole }) => {
  const { user, role } = useAuth();
  console.log('PrivateRoute Check:', { 
    hasUser: !!user,
    userEmail: user?.email, 
    role: role,
    requiredRole: requiredRole,
    componentName: Component.name 
  });

  // If no user, redirect to login
  if (!user) {
    console.log('PrivateRoute: No user found, redirecting to login.'); 
    return <Navigate to="/login" />;
  }

  // For admin role, allow access to everything
  if (role === 'admin') {
    console.log('PrivateRoute: Admin role confirmed, rendering component:', Component.name); 
    return <Component />;
  }

  // For viewer role
  if (role === 'viewer') {
    console.log('PrivateRoute: Viewer role confirmed.'); 
    // If trying to access a route that requires admin role
    if (requiredRole === 'admin') {
      console.log(`PrivateRoute: Viewer trying to access admin route (${Component.name}), redirecting to dashboard.`); 
      return <Navigate to="/dashboard" replace />;
    }
    // Allow access to dashboard or other non-admin routes
    console.log(`PrivateRoute: Viewer allowed access to non-admin route (${Component.name}).`); 
    return <Component />;
  }

  // Default: redirect to dashboard if role is unknown or neither admin/viewer
  console.log(`PrivateRoute: Unknown or invalid role (${role}), redirecting to dashboard.`); 
  return <Navigate to="/dashboard" replace />;
};

export default PrivateRoute;

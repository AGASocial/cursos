import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateAdminRouteProps {
  children: React.ReactNode;
}

export const PrivateAdminRoute: React.FC<PrivateAdminRouteProps> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();


  if (!user || !isAdmin) {
    // Redirect to home while saving the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
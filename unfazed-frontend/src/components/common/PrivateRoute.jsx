import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ clientRoute = false }) => {
  const { isAuthenticated, loading, userType, token, user } = useAuth();
  const location = useLocation();

  // DEBUG LOG — prints every render
  console.log(
  `[PrivateRoute] path=${location.pathname} clientRoute=${clientRoute} hasToken=${!!token} hasUser=${!!user} userType=${userType} loading=${loading} isAuth=${isAuthenticated}`
);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Verifying access..." />
      </div>
    );
  }

  // If token exists but user hasn't loaded yet → keep waiting
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading user..." />
      </div>
    );
  }

  // No token at all → redirect
  if (!token) {
    const dest = clientRoute ? '/client/login' : '/login';
    console.log('[PrivateRoute] Redirecting to', dest, 'because no token');
    return <Navigate to={dest} replace />;
  }

  // Wrong portal
  if (clientRoute && userType !== 'client') {
    console.log('[PrivateRoute] Bouncing therapist out of client route');
    return <Navigate to="/therapist/dashboard" replace />;
  }
  if (!clientRoute && userType !== 'therapist') {
    console.log('[PrivateRoute] Bouncing client out of therapist route');
    return <Navigate to="/client/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a component and:
 *   1. Redirects to /login if the user is not authenticated
 *   2. Redirects to the correct dashboard if the user's role doesn't match
 *
 * @param {React.ReactNode} children - the protected page to render
 * @param {string|string[]} role     - required role(s) to access the route
 */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // While hydrating from localStorage, show a spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blood-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to /login, remembering the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — supports single string or array of roles
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (role && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard
    const dashboardMap = { donor: '/donor', recipient: '/recipient', admin: '/admin' };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;

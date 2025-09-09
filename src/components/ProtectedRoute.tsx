import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, isSuperUser, needsApproval } from '../lib/authHelpers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperUser?: boolean;
  allowUnapproved?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireSuperUser = false,
  allowUnapproved = false 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs approval and it's not allowed
  if (!allowUnapproved && needsApproval(user)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="bg-orange-500/10 text-orange-400 p-4 rounded-full inline-flex mb-6">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-orange-400 mb-4">
            Venter på godkjenning
          </h1>
          <p className="text-gray-300 mb-6">
            Medlemskapet ditt venter på godkjenning fra en administrator. 
            Du vil motta en e-post når kontoen din er aktivert.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Oppdater status
          </button>
        </div>
      </div>
    );
  }

  // Check super user requirement
  if (requireSuperUser && !isSuperUser(user)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-500/10 text-red-400 p-4 rounded-full inline-flex mb-6">
            <Shield className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Ingen tilgang
          </h1>
          <p className="text-gray-300 mb-6">
            Kun super-administratorer har tilgang til dette området.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-500/10 text-red-400 p-4 rounded-full inline-flex mb-6">
            <Shield className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Ingen tilgang
          </h1>
          <p className="text-gray-300 mb-6">
            Kun administratorer har tilgang til dette området.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
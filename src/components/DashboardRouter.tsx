import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from './ErrorBoundary';
import { Home } from '../pages/Home';
import { Scanner } from '../pages/Scanner';
import { TrainingLog } from '../pages/TrainingLog';
import { Profile } from '../pages/Profile';
import { Admin } from '../pages/Admin';
import { SuperAdmin } from '../pages/SuperAdmin';
import { OrganizationDashboard } from '../pages/OrganizationDashboard';
import { useAuth } from '../contexts/AuthContext';

export function DashboardRouter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [initialRoutingDone, setInitialRoutingDone] = useState(false);
  const [routingTimeout, setRoutingTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout for routing to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Routing timeout reached, allowing access');
      setRoutingTimeout(true);
      setInitialRoutingDone(true);
    }, 5000);

    // Don't do initial routing if still loading or no user
    if (loading || !user) {
      return () => clearTimeout(timeoutId);
    }

    // If we have a user but no user_type, allow access to home
    if (!user.user_type) {
      console.warn('⚠️ User has no user_type, allowing home access');
      setInitialRoutingDone(true);
      clearTimeout(timeoutId);
      return;
    }

    // Only do initial routing if we haven't done it yet and we're on root path
    if (!initialRoutingDone && location.pathname === '/') {
      console.log('🧭 Performing initial routing for user:', user.user_type, user.member_profile?.role);
      
      // Determine the target path based on user role for initial routing only
      let targetPath = '/';
      
      if (user.user_type === 'super_user') {
        targetPath = '/super-admin';
        console.log('👑 Initial route for super user: /super-admin');
      } else if (user.user_type === 'organization_member') {
        const memberRole = user.member_profile?.role;
        
        if (memberRole === 'admin' || memberRole === 'range_officer') {
          targetPath = '/admin';
          console.log('🛡️ Initial route for admin/range officer: /admin');
        } else {
          targetPath = '/';
          console.log('👤 Initial route for regular member: /');
        }
      }
      
      // Navigate to target path for initial routing
      if (targetPath !== '/') {
        console.log(`🔄 Initial navigation to ${targetPath}`);
        navigate(targetPath, { replace: true });
      }
    }
    
    setInitialRoutingDone(true);
    clearTimeout(timeoutId);
  }, [user, loading, navigate, location.pathname, initialRoutingDone]);

  // Show loading while determining route (with timeout fallback)
  if (!routingTimeout && (loading || !user || (!user.user_type && !initialRoutingDone))) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-org-primary mx-auto mb-4"></div>
          <p className="text-gray-400">
            {loading ? 'Laster...' : !user ? 'Autentiserer...' : 'Bestemmer rute...'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Venter på brukerdata...
          </p>
        </div>
      </div>
    );
  }

  // If we reach here, show the dashboard even if user data is incomplete
  if (!user) {
    console.warn('⚠️ Rendering dashboard without user data due to timeout');
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <ErrorBoundary>
              <ProtectedRoute allowUnapproved={true}>
                <Home />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/scanner" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/log" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <TrainingLog />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/profile" element={
            <ErrorBoundary>
              <ProtectedRoute allowUnapproved={true}>
                <Profile />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/admin" element={
            <ErrorBoundary>
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/super-admin" element={
            <ErrorBoundary>
              <ProtectedRoute requireSuperUser={true}>
                <SuperAdmin />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          <Route path="/organization/:orgId" element={
            <ErrorBoundary>
              <ProtectedRoute requireSuperUser={true}>
                <OrganizationDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
        </Routes>
      </main>
    </div>
  );
}
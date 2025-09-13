import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { ProtectedRoute } from './ProtectedRoute';
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

  useEffect(() => {
    // Don't redirect if still loading or no user
    if (loading || !user) return;

    console.log('🧭 Determining dashboard route for user:', user.user_type, user.member_profile?.role);
    
    // Determine the target path based on user role
    let targetPath = '/';
    
    if (user.user_type === 'super_user') {
      targetPath = '/super-admin';
      console.log('👑 Target path for super user: /super-admin');
    } else if (user.user_type === 'organization_member') {
      const memberRole = user.member_profile?.role;
      
      if (memberRole === 'admin' || memberRole === 'range_officer') {
        targetPath = '/admin';
        console.log('🛡️ Target path for admin/range officer: /admin');
      } else {
        targetPath = '/';
        console.log('👤 Target path for regular member: /');
      }
    }
    
    // Only navigate if we're not already on the target path
    if (location.pathname !== targetPath) {
      console.log(`🔄 Navigating from ${location.pathname} to ${targetPath}`);
      navigate(targetPath, { replace: true });
    } else {
      console.log(`✅ Already on correct path: ${location.pathname}`);
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading while determining route
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute allowUnapproved={true}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/scanner" element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          } />
          <Route path="/log" element={
            <ProtectedRoute>
              <TrainingLog />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowUnapproved={true}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/super-admin" element={
            <ProtectedRoute requireSuperUser={true}>
              <SuperAdmin />
            </ProtectedRoute>
          } />
          <Route path="/organization/:orgId" element={
            <ProtectedRoute requireSuperUser={true}>
              <OrganizationDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}
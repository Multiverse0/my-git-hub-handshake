import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
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

    // Don't redirect if user is already on a specific page (avoid redirect loops)
    if (location.pathname !== '/') return;

    // Determine the appropriate dashboard based on user role
    const redirectToDashboard = () => {
      if (user.user_type === 'super_user') {
        // Super users go to super admin dashboard
        navigate('/super-admin', { replace: true });
      } else if (user.user_type === 'organization_member') {
        const memberRole = user.member_profile?.role;
        
        if (memberRole === 'admin' || memberRole === 'range_officer') {
          // Admins and range officers go to admin dashboard
          navigate('/admin', { replace: true });
        } else {
          // Regular members stay on home page (already at '/')
          // No navigation needed
        }
      }
    };

    redirectToDashboard();
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
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/log" element={<TrainingLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/organization/:orgId" element={<OrganizationDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
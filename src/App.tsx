import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Scanner } from './pages/Scanner';
import { TrainingLog } from './pages/TrainingLog';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { SuperAdmin } from './pages/SuperAdmin';
import { OrganizationDashboard } from './pages/OrganizationDashboard';
import { LandingPage } from './components/LandingPage';
import { SuperUserSetup } from './pages/SuperUserSetup';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

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
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useAuth();

  React.useEffect(() => {
    // Set CSS custom properties for dynamic theming
    document.documentElement.style.setProperty('--primary-color', branding.primary_color);
    document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
    
    // Apply background color if available and not in light mode
    const currentTheme = localStorage.getItem('userTheme');
    if (branding.background_color && currentTheme !== 'light') {
      document.documentElement.style.setProperty('--background-color', branding.background_color);
      document.body.style.backgroundColor = branding.background_color;
    }
  }, [branding]);

  return <>{children}</>;
}

function App() {
  const { needsSetup, checkSetupStatus } = useAuth();

  const handleSetupComplete = async () => {
    await checkSetupStatus();
  };

  // Show setup page if no super users exist
  if (needsSetup) {
    return (
      <SuperUserSetup onSetupComplete={handleSetupComplete} />
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
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
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
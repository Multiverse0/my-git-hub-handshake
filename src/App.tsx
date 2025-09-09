import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DashboardRouter } from './components/DashboardRouter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { LandingPage } from './components/LandingPage';
import { SuperUserSetup } from './pages/SuperUserSetup';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

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
    console.log('🎉 Setup completed, checking status...');
    await checkSetupStatus();
  };

  // Show setup page if no super users exist
  if (needsSetup) {
    console.log('🔧 Showing setup page - no super users exist');
    return (
      <SuperUserSetup onSetupComplete={handleSetupComplete} />
    );
  }

  console.log('✅ Setup complete, showing main app');
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/landing" element={<LandingPage />} />
          
          {/* Protected routes - require authentication */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <DashboardRouter />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardRouter } from './components/DashboardRouter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Set a timeout to prevent infinite loading on the main route
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Auth loading timeout reached');
        setTimeoutReached(true);
      }, 8000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laster brukerdata...</p>
          <p className="text-gray-500 text-sm mt-2">
            Dette kan ta noen sekunder...
          </p>
        </div>
      </div>
    );
  }
  
  // If timeout reached and still not authenticated, redirect to login
  if (timeoutReached && !isAuthenticated) {
    console.warn('⏰ Auth timeout reached, redirecting to login');
    return <Navigate to="/login" />;
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
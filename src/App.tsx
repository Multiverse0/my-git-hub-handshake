import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardRouter } from './components/DashboardRouter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, initError } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);

  console.log('[PrivateRoute] State:', { isAuthenticated, loading, initError, timeoutReached });

  // Set a timeout to prevent infinite loading on the main route
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Auth loading timeout reached');
        setTimeoutReached(true);
      }, 20000); // 20 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Show error if there's an initialization error
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-lg w-full text-center">
          <div className="text-red-400 text-xl font-semibold mb-4">
            Connection Error
          </div>
          <div className="text-gray-300 mb-4">
            {initError}
          </div>
          <div className="space-y-2">
            <button 
              className="btn-primary w-full"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
            <button 
              className="btn-secondary w-full"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
  console.log('[App] Rendering...');
  
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
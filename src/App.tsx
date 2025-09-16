import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardRouter } from './components/DashboardRouter';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';
import { ForgotPassword } from './pages/ForgotPassword';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-org-primary mx-auto mb-4"></div>
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

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { branding } = useAuth();

  React.useEffect(() => {
    // Set CSS custom properties for dynamic theming
    document.documentElement.style.setProperty('--primary-color', branding.primary_color);
    document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
    
    // Convert hex colors to HSL and set organization theme variables
    if (branding.primary_color) {
      const primaryHsl = hexToHsl(branding.primary_color);
      document.documentElement.style.setProperty('--org-primary', primaryHsl);
    }
    
    if (branding.secondary_color) {
      const secondaryHsl = hexToHsl(branding.secondary_color);
      document.documentElement.style.setProperty('--org-secondary', secondaryHsl);
    }
    
    // Apply background color if available and not in light mode
    const currentTheme = localStorage.getItem('userTheme');
    if (branding.background_color && currentTheme !== 'light') {
      document.documentElement.style.setProperty('--background-color', branding.background_color);
      document.body.style.backgroundColor = branding.background_color;
      
      const backgroundHsl = hexToHsl(branding.background_color);
      document.documentElement.style.setProperty('--org-background', backgroundHsl);
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
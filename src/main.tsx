import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import { EmergencyFallback } from './components/EmergencyFallback';
import './index.css';

console.log('[Main] Application starting...');

// Add a final safety net for emergency cases
const renderApp = () => {
  try {
    return (
      <StrictMode>
        <AppErrorBoundary fallback={<EmergencyFallback />}>
          <LanguageProvider>
            <AuthProvider>
              <App />
              <DebugPanel />
            </AuthProvider>
          </LanguageProvider>
        </AppErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('[Main] Critical error during render setup:', error);
    return <EmergencyFallback />;
  }
};

const root = createRoot(document.getElementById('root')!);
root.render(renderApp());

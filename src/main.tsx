import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import { EmergencyFallback } from './components/EmergencyFallback';
import { supabase } from './integrations/supabase/client';
import './index.css';

console.log('[Main] Application starting...');

// Crash tracking and recovery system
const CRASH_KEY = 'app_crashes';
const CRASH_WINDOW = 60000; // 60 seconds
const MAX_CRASHES = 3;

interface CrashRecord {
  timestamp: number;
  error: string;
  url: string;
}

function recordCrash(error: Error | string) {
  const crashes: CrashRecord[] = JSON.parse(sessionStorage.getItem(CRASH_KEY) || '[]');
  const now = Date.now();
  
  // Remove old crashes outside the window
  const recentCrashes = crashes.filter(c => now - c.timestamp < CRASH_WINDOW);
  
  // Add new crash
  recentCrashes.push({
    timestamp: now,
    error: error instanceof Error ? error.message : String(error),
    url: window.location.href
  });
  
  sessionStorage.setItem(CRASH_KEY, JSON.stringify(recentCrashes));
  
  // Check if we've hit the crash limit
  if (recentCrashes.length >= MAX_CRASHES) {
    console.error(`[Main] 🚨 ${MAX_CRASHES} crashes in ${CRASH_WINDOW/1000}s - initiating emergency recovery`);
    performEmergencyRecovery();
  }
}

async function performEmergencyRecovery() {
  try {
    // Sign out
    await supabase.auth.signOut();
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = '/login';
  } catch (e) {
    console.error('[Main] Emergency recovery failed:', e);
    // Force reload as last resort
    window.location.reload();
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('[Main] 🔥 Uncaught error:', event.error);
  recordCrash(event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] 🔥 Unhandled promise rejection:', event.reason);
  recordCrash(event.reason);
});

// Error boundary callback
const handleErrorBoundary = (error: Error) => {
  console.error('[Main] 🔥 Error boundary caught:', error);
  recordCrash(error);
};

// Add a final safety net for emergency cases
const renderApp = () => {
  try {
    return (
      <StrictMode>
        <AppErrorBoundary 
          fallback={<EmergencyFallback />}
          onError={handleErrorBoundary}
        >
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
    recordCrash(error instanceof Error ? error : String(error));
    return <EmergencyFallback />;
  }
};

const root = createRoot(document.getElementById('root')!);
root.render(renderApp());

import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export function EmergencyFallback() {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string>('');
  
  // Get last crash info
  const crashData = sessionStorage.getItem('app_crashes');
  const crashes = crashData ? JSON.parse(crashData) : [];
  const lastCrash = crashes[crashes.length - 1];
  const crashId = lastCrash ? `#${Date.now().toString(36).toUpperCase()}` : null;
  
  const handleClearCacheAndRetry = async () => {
    try {
      console.log('[EmergencyFallback] Clearing cache and signing out...');
      
      // Sign out
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('[EmergencyFallback] Clear cache failed:', error);
      // Force reload as fallback
      window.location.reload();
    }
  };
  
  const handleHealthCheck = async () => {
    setIsChecking(true);
    setCheckResult('');
    
    try {
      console.log('[EmergencyFallback] Running health check...');
      
      // Test Supabase connection
      const { error } = await supabase.from('organizations').select('count').limit(1);
      
      if (error) {
        setCheckResult(`❌ Database connection failed: ${error.message}`);
      } else {
        setCheckResult('✅ Database connection successful');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      setCheckResult(`❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          System Loading...
        </h1>
        <p className="text-gray-300 mb-6">
          If you're seeing this for more than 30 seconds, there might be a connection issue.
        </p>
        
        {crashId && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">
              Crash ID: <span className="font-mono font-bold">{crashId}</span>
            </p>
            {process.env.NODE_ENV === 'development' && lastCrash && (
              <p className="text-red-300 text-xs mt-1">
                {lastCrash.error}
              </p>
            )}
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <h3 className="font-semibold text-yellow-400 mb-3">Recovery Actions:</h3>
          <div className="space-y-2">
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium"
              onClick={handleClearCacheAndRetry}
            >
              🔄 Clear Cache & Retry
            </button>
            <button 
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleHealthCheck}
              disabled={isChecking}
            >
              {isChecking ? '⏳ Checking...' : '🏥 Run Health Check'}
            </button>
            <button 
              className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={() => window.location.reload()}
            >
              ↻ Reload Page
            </button>
            <button 
              className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={() => window.location.href = '/login'}
            >
              → Go to Login
            </button>
          </div>
          
          {checkResult && (
            <div className="mt-3 p-2 bg-gray-900 rounded text-sm">
              {checkResult}
            </div>
          )}
        </div>

        <details className="text-left">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            System Status
          </summary>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <div>URL: {window.location.href}</div>
            <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
            {crashes.length > 0 && (
              <div>Crashes: {crashes.length} in last 60s</div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useState, useEffect } from 'react';

export function DebugPanel() {
  const { isAuthenticated, user, organization, loading } = useAuth();
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [dbTest, setDbTest] = useState<string>('Testing...');

  useEffect(() => {
    const testSupabase = async () => {
      try {
        console.log('[DebugPanel] Testing Supabase connection...');
        const { error } = await supabase.from('organizations').select('count').limit(1);
        if (error) {
          console.error('[DebugPanel] Supabase error:', error);
          setSupabaseConnected(false);
          setDbTest(`Error: ${error.message}`);
        } else {
          console.log('[DebugPanel] Supabase connected successfully');
          setSupabaseConnected(true);
          setDbTest('Connected');
        }
      } catch (err) {
        console.error('[DebugPanel] Supabase connection failed:', err);
        setSupabaseConnected(false);
        setDbTest(`Failed: ${err}`);
      }
    };

    testSupabase();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 text-xs font-mono z-50 max-w-sm">
      <div className="font-semibold text-yellow-400 mb-2">Debug Panel</div>
      
      <div className="space-y-1 text-gray-300">
        <div>Auth Loading: {loading ? '🔄' : '✅'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user ? '✅' : '❌'}</div>
        <div>Organization: {organization ? '✅' : '❌'}</div>
        <div>Supabase: {supabaseConnected === null ? '🔄' : supabaseConnected ? '✅' : '❌'}</div>
        <div>DB Test: {dbTest}</div>
        
        <div className="pt-2 border-t border-gray-600 mt-2">
          <div>Route: {window.location.pathname}</div>
          <div>User Agent: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}</div>
        </div>
      </div>
    </div>
  );
}
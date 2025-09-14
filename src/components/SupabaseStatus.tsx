import { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../lib/database';

interface SupabaseStatusProps {
  showDetails?: boolean;
}

export function SupabaseStatus({ showDetails = false }: SupabaseStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [details, setDetails] = useState<{
    database: boolean;
    auth: boolean;
    storage: boolean;
    realtime: boolean;
  }>({
    database: false,
    auth: false,
    storage: false,
    realtime: false
  });

  useEffect(() => {
    checkSupabaseConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkSupabaseConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      setStatus('checking');
      
      // Test database connection
      const dbHealth = await DatabaseService.healthCheck();
      
      // Test auth
      await supabase.auth.getSession();
      const authWorking = true; // Auth endpoint responded
      
      // Test storage
      const { data: buckets } = await supabase.storage.listBuckets();
      const storageWorking = Array.isArray(buckets);
      
      // Test realtime (basic check)
      const realtimeWorking = supabase.realtime.isConnected();
      
      setDetails({
        database: dbHealth,
        auth: authWorking,
        storage: storageWorking,
        realtime: realtimeWorking
      });
      
      if (dbHealth && authWorking && storageWorking) {
        setStatus('connected');
      } else if (dbHealth || authWorking) {
        setStatus('error');
      } else {
        setStatus('disconnected');
      }
      
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      setStatus('disconnected');
      setDetails({
        database: false,
        auth: false,
        storage: false,
        realtime: false
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Sjekker tilkobling...';
      case 'connected':
        return 'Tilkoblet Supabase';
      case 'error':
        return 'Delvis tilkobling';
      case 'disconnected':
        return 'Ikke tilkoblet';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-blue-400';
      case 'connected':
        return 'text-green-400';
      case 'error':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
    }
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-svpk-yellow" />
        <h3 className="font-semibold">Supabase Status</h3>
        <button
          onClick={checkSupabaseConnection}
          className="ml-auto btn-secondary text-xs"
        >
          Oppdater
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Database</span>
          <div className="flex items-center gap-2">
            {details.database ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${details.database ? 'text-green-400' : 'text-red-400'}`}>
              {details.database ? 'Tilkoblet' : 'Frakoblet'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Autentisering</span>
          <div className="flex items-center gap-2">
            {details.auth ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${details.auth ? 'text-green-400' : 'text-red-400'}`}>
              {details.auth ? 'Tilkoblet' : 'Frakoblet'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Fillagring</span>
          <div className="flex items-center gap-2">
            {details.storage ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${details.storage ? 'text-green-400' : 'text-red-400'}`}>
              {details.storage ? 'Tilkoblet' : 'Frakoblet'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Sanntid</span>
          <div className="flex items-center gap-2">
            {details.realtime ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${details.realtime ? 'text-green-400' : 'text-red-400'}`}>
              {details.realtime ? 'Tilkoblet' : 'Frakoblet'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {status === 'disconnected' && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-red-200 text-xs">
            Sjekk at Supabase-prosjektet er aktivt og at environment variables er korrekt satt.
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-200 text-xs">
            Noen Supabase-tjenester er ikke tilgjengelige. Sjekk prosjektstatus.
          </div>
        )}
      </div>
    </div>
  );
}
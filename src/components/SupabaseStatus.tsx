import { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, AlertTriangle, Loader2, Wifi, WifiOff, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../lib/database';

interface SupabaseStatusProps {
  showDetails?: boolean;
  collapsible?: boolean;
  iconOnly?: boolean;
}

export function SupabaseStatus({ showDetails = false, collapsible = false, iconOnly = false }: SupabaseStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [isExpanded, setIsExpanded] = useState(false);
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

  if (collapsible) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">System Status:</span>
            {getStatusIcon()}
            <span className={`${getStatusColor()} font-medium`}>{getStatusText()}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-700/50">
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Database</span>
                <div className="flex items-center gap-1">
                  {details.database ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${details.database ? 'text-green-400' : 'text-red-400'}`}>
                    {details.database ? 'OK' : 'Error'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Auth</span>
                <div className="flex items-center gap-1">
                  {details.auth ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${details.auth ? 'text-green-400' : 'text-red-400'}`}>
                    {details.auth ? 'OK' : 'Error'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Storage</span>
                <div className="flex items-center gap-1">
                  {details.storage ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${details.storage ? 'text-green-400' : 'text-red-400'}`}>
                    {details.storage ? 'OK' : 'Error'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Realtime</span>
                <div className="flex items-center gap-1">
                  {details.realtime ? (
                    <Wifi className="w-3 h-3 text-green-400" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${details.realtime ? 'text-green-400' : 'text-red-400'}`}>
                    {details.realtime ? 'OK' : 'Error'}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700/50">
                <button
                  onClick={checkSupabaseConnection}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (iconOnly) {
    return (
      <div className="relative group">
        <div className="cursor-help">
          {getStatusIcon()}
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {getStatusText()}
        </div>
      </div>
    );
  }

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
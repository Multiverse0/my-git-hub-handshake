import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { getOrganizationBySlug } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Organization } from '../lib/types';

export function ForgotPassword() {
  const { branding } = useAuth();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Load organization info
  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const result = await getOrganizationBySlug(orgSlug);
        if (result.data) {
          setOrganization(result.data);
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoadingOrg(false);
      }
    };

    loadOrganization();
  }, [orgSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Vennligst skriv inn din e-post');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use Supabase Auth password reset via edge function
      const resetUrl = `${window.location.origin}/reset-password?org=${orgSlug}`;
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          template: 'password_reset',
          data: {
            organizationName: organization?.name || 'Aktivlogg',
            recipientName: 'Bruker', // Will be updated by edge function
            email: email,
            resetUrl: resetUrl,
            loginUrl: `${window.location.origin}/login?org=${orgSlug}`
          },
          organizationId: organization?.id || 'default',
          resetPassword: true // Special flag to indicate password reset
        }
      });

      if (error) {
        throw error;
      }

      // Handle response from Edge Function
      if (data && typeof data === 'object') {
        if (data.success === false) {
          throw new Error(data.error || 'Password reset failed');
        }
      }

      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Det oppstod en feil. Prøv igjen senere.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laster...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            E-post sendt!
          </h1>
          <p className="text-gray-400 mb-6">
            Vi har sendt instruksjoner for tilbakestilling av passord til {email}. 
            Sjekk innboksen din og følg instruksjonene.
          </p>
          <Link
            to={`/login?org=${orgSlug}`}
            className="inline-flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: organization?.primary_color || branding.primary_color }}
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til innlogging
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          {organization?.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt={`${organization.name} Logo`} 
              className="h-16 max-w-[200px] object-contain mb-6"
            />
          ) : (
            <div 
              className="h-16 px-6 flex items-center rounded font-bold text-2xl mb-6"
              style={{ 
                backgroundColor: organization?.primary_color || branding.primary_color, 
                color: organization?.secondary_color || branding.secondary_color 
              }}
            >
              {(organization?.name || branding.organization_name).split(' ').map(word => word[0]).join('').toUpperCase()}
            </div>
          )}
          
          <h1
            className="text-2xl font-bold"
            style={{ color: organization?.primary_color || branding.primary_color }}
          >
            Glemt passord?
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Skriv inn din e-post for å tilbakestille passordet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 border border-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-colors"
                placeholder="navn@example.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: organization?.primary_color || branding.primary_color,
              color: organization?.secondary_color || branding.secondary_color
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sender...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send tilbakestillingslink
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              to={`/login?org=${orgSlug}`}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til innlogging
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
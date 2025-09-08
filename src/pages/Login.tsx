import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrganizationBySlug, supabase } from '../lib/supabase';
import type { Organization } from '../lib/types';

export function Login() {
  const navigate = useNavigate();
  const { login, branding } = useAuth();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk'; // Default to SVPK
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Check for remembered email on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      const { email } = JSON.parse(rememberedUser);
      setEmail(email);
      setRememberMe(true);
    }
  }, []);

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
    if (!email || !password) {
      setError('Vennligst fyll ut alle felt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email, password, rememberMe, orgSlug);
      // DashboardRouter will handle the appropriate redirection based on user role
      navigate('/', { replace: true });
    } catch (error) {
      setError('Det oppstod en feil ved innlogging');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Vennligst skriv inn e-postadressen din først');
      return;
    }

    try {
      setError(null);
      setResetMessage(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError('Kunne ikke sende tilbakestillings-e-post');
      } else {
        setResetMessage('E-post med instruksjoner for tilbakestilling av passord er sendt!');
      }
    } catch (error) {
      setError('Det oppstod en feil ved sending av tilbakestillings-e-post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          {loadingOrg ? (
            <div className="h-16 w-32 bg-gray-700 animate-pulse rounded mb-6"></div>
          ) : organization?.logo_url ? (
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
            Admin-inngang til Treningslogg
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Skriv inn hvilken som helst e-post og passord for å få admin-tilgang
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
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="navn@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 text-svpk-yellow focus:ring-svpk-yellow"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
              Husk meg
            </label>
          </div>

          {resetMessage && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{resetMessage}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logger inn...
              </>
            ) : (
              'Logg inn'
            )}
          </button>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 max-w-sm">
              <p className="text-blue-200 text-sm">
                <strong>Demo-modus:</strong> Skriv inn hvilken som helst e-post og passord for å få admin-tilgang til systemet.
              </p>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrganizationBySlug } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Organization } from '../lib/types';

export function ResetPassword() {
  const { branding } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Check if we have the required tokens
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

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

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setError('Ugyldig tilbakestillingslink. Vennligst be om en ny link.');
      return;
    }

    // Set the session with the tokens from the URL
    const setSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setError('Ugyldig eller utløpt tilbakestillingslink');
      }
    };

    setSession();
  }, [accessToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Vennligst fyll ut alle felt');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens');
      return;
    }

    if (password.length < 6) {
      setError('Passordet må være minst 6 tegn langt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError('Kunne ikke oppdatere passord');
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/login?org=${orgSlug}`);
        }, 2000);
      }
    } catch (error) {
      setError('Det oppstod en feil ved oppdatering av passord');
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
            Passord oppdatert!
          </h1>
          <p className="text-gray-400 mb-6">
            Ditt passord har blitt oppdatert. Du blir omdirigert til innloggingssiden...
          </p>
          <Link
            to={`/login?org=${orgSlug}`}
            className="inline-flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: organization?.primary_color || branding.primary_color }}
          >
            <ArrowLeft className="w-4 h-4" />
            Gå til innlogging
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
            Tilbakestill passord
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Skriv inn ditt nye passord
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nytt passord
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bekreft nytt passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
                Oppdaterer passord...
              </>
            ) : (
              'Oppdater passord'
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
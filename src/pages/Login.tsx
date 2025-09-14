import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle, Loader2, Eye, EyeOff, Building2, ArrowRight } from "lucide-react";
import { getOrganizationBySlug } from "../lib/supabase";
import type { Organization } from "../lib/types";

export function Login() {
  const navigate = useNavigate();
  const { login, branding, user } = useAuth();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

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

  // Fix the login page route to use ForgotPassword page
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
      
      // Navigation will be handled by the AuthContext and DashboardRouter
    } catch (err) {
      console.error("Login failed:", err);
      let errorMessage = 'Det oppstod en feil ved innlogging';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Ugyldig e-post eller passord';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'E-posten din er ikke bekreftet. Sjekk innboksen din.';
        } else if (err.message.includes('Too many requests')) {
          errorMessage = 'For mange forsøk. Prøv igjen senere.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laster organisasjon...</p>
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
            Logg inn
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Logg inn til {organization?.name || branding.organization_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-4 pr-4 py-2 text-white placeholder-gray-400 border border-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-colors"
                placeholder="navn@example.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Passord
              </label>
              <Link
                to={`/forgot-password?org=${orgSlug}`}
                className="text-sm hover:opacity-80"
                style={{ color: organization?.primary_color || branding.primary_color }}
              >
                Glemt passord?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-4 pr-12 py-2 text-white placeholder-gray-400 border border-gray-600 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-800"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Husk meg
              </label>
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
            className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
            style={{ 
              backgroundColor: organization?.primary_color || branding.primary_color,
              color: organization?.secondary_color || branding.secondary_color
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logger inn...
              </>
            ) : (
              <>
                Logg inn
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="text-center space-y-4">
            <div className="text-sm text-gray-400">
              Har du ikke konto?{' '}
              <Link
                to={`/register?org=${orgSlug}`}
                className="font-medium hover:opacity-80 transition-opacity"
                style={{ color: organization?.primary_color || branding.primary_color }}
              >
                Registrer deg her
              </Link>
            </div>
            
            {organization && (
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Building2 className="w-4 h-4" />
                  <span>Medlem av {organization.name}</span>
                </div>
                {organization.website && (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:opacity-80 transition-opacity mt-1 inline-block"
                    style={{ color: organization.primary_color || branding.primary_color }}
                  >
                    Besøk vår nettside
                  </a>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
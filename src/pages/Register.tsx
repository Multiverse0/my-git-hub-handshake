import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Hash, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrganizationBySlug, checkSuperUsersExist, createFirstSuperUser } from '../lib/supabase';
import type { Organization } from '../lib/types';

export function Register() {
  const navigate = useNavigate();
  const { register, branding } = useAuth();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    memberNumber: '',
    role: 'member' as 'member' | 'admin' | 'range_officer' | 'super_user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Check if system needs setup (no super users exist)
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const superUsersExist = await checkSuperUsersExist();
        setNeedsSetup(!superUsersExist);
        
        if (!superUsersExist) {
          setFormData(prev => ({ ...prev, role: 'super_user' }));
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
        setNeedsSetup(true);
        setFormData(prev => ({ ...prev, role: 'super_user' }));
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetup();
  }, []);

  // Load organization info
  useEffect(() => {
    if (needsSetup) {
      setLoadingOrg(false);
      return;
    }

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
  }, [orgSlug, needsSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vennligst fyll ut alle felt');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passordet må være minst 8 tegn langt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      if (formData.role === 'super_user') {
        // Create first super user
        const result = await createFirstSuperUser(
          formData.email,
          formData.password,
          formData.fullName
        );

        if (result.error) {
          throw new Error(result.error);
        }

        setSuccess('Super-bruker opprettet! Du blir automatisk logget inn...');
        
        // Auto-login and redirect to super admin
        setTimeout(() => {
          navigate('/super-admin');
        }, 2000);
      } else {
        // Register organization member
        await register(
          orgSlug,
          formData.email,
          formData.password,
          formData.fullName,
          formData.memberNumber,
          formData.role
        );

        setSuccess('Registrering vellykket! Du kan nå logge inn når en administrator har godkjent medlemskapet ditt.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate(`/login?org=${orgSlug}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Det oppstod en feil ved registrering');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Sjekker systemstatus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          {needsSetup ? (
            <div className="text-center mb-6">
              <div className="bg-blue-500/10 text-blue-400 p-4 rounded-full inline-flex mb-4">
                <UserPlus className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-blue-400">Første gangs oppsett</h1>
              <p className="text-gray-400 mt-2">Opprett den første super-brukeren</p>
            </div>
          ) : loadingOrg ? (
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
            {needsSetup ? 'System Oppsett' : 'Registrer deg'}
          </h1>
          <p className="text-gray-400 text-center mt-2">
            {needsSetup 
              ? 'Opprett den første administratoren' 
              : `Bli medlem av ${organization?.name || 'organisasjonen'}`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fullt navn
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="Ola Nordmann"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="navn@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          {!needsSetup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SkytterID
              </label>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">
                  <a
                    href="https://app.skyting.no/user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80"
                    style={{ color: organization?.primary_color || branding.primary_color }}
                  >
                    (Finn din SkytterID her)
                  </a>
                </span>
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.memberNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, memberNumber: e.target.value }))}
                  className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                  placeholder="12345"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!needsSetup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full bg-gray-700 rounded-lg px-4 py-2"
                disabled={isLoading}
              >
                <option value="member">Medlem</option>
                <option value="range_officer">Standplassleder</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
              Bekreft passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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

          {success && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{success}</p>
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
                Registrerer...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                {needsSetup ? 'Opprett Super-bruker' : 'Registrer deg'}
              </>
            )}
          </button>

          {!needsSetup && (
            <div className="text-center">
              <div className="text-sm text-gray-400">
                Har du allerede konto?{' '}
                <Link
                  to={`/login?org=${orgSlug}`}
                  className="hover:opacity-80"
                  style={{ color: organization?.primary_color || branding.primary_color }}
                >
                  Logg inn her
                </Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User, Hash, Loader2, AlertCircle, ArrowLeft, ExternalLink, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createFirstSuperUser, getOrganizationBySlug } from '../lib/supabase';
import type { Organization } from '../lib/types';

export function Register() {
  const navigate = useNavigate();
  const { register, needsSetup, checkSetupStatus } = useAuth();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    memberNumber: '',
    role: 'member' as 'member' | 'admin' | 'range_officer' | 'super_user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
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

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('Vennligst fyll ut alle påkrevde felt');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passordene må være like');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passordet må være minst 8 tegn');
      return;
    }

    // Validate member number for non-super users
    if (formData.role !== 'super_user' && !formData.memberNumber) {
      setError('Skytter ID er påkrevd for medlemmer, administratorer og standplassledere');
      return;
    }

    // Validate super user registration
    if (formData.role === 'super_user' && !needsSetup) {
      setError('Super-bruker kan kun opprettes hvis ingen super-bruker eksisterer. Kontakt en eksisterende super-bruker for å få opprettet din konto.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📝 Submitting registration for:', formData.email, 'Role:', formData.role);
      
      if (formData.role === 'super_user') {
        // Create first super user
        const result = await createFirstSuperUser(formData.email, formData.password, formData.fullName);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Super user registration successful');
        
        // Auto-login the new super user and redirect
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });
          
          if (signInError) {
            console.warn('Auto-login failed:', signInError);
            // Still show success but user will need to login manually
          } else {
            console.log('✅ Auto-login successful');
            // Navigate to super admin after a short delay
            setTimeout(() => {
              navigate('/super-admin', { replace: true });
            }, 2000);
          }
        } catch (autoLoginError) {
          console.warn('Auto-login error:', autoLoginError);
        }
      } else {
        // Use existing registration for organization members
        await register(
          orgSlug,
          formData.email,
          formData.password,
          formData.fullName,
          formData.memberNumber,
          formData.role
        );
        
        console.log('✅ Organization member registration successful');
      }
      
      setRegistrationSubmitted(true);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Det oppstod en feil ved registrering');
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSubmitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="bg-green-500/10 text-green-400 p-4 rounded-full inline-flex mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 
            className="text-2xl font-bold mb-4"
            style={{ color: organization?.primary_color || '#FFD700' }}
          >
            {formData.role === 'super_user' ? 'Super-bruker Opprettet!' : 'Registrering Mottatt'}
          </h1>
          
          {formData.role === 'super_user' ? (
            <div>
              <p className="text-gray-300 mb-6">
                Din super-bruker konto er opprettet og du blir automatisk logget inn. 
                Du har nå full tilgang til hele systemet og blir omdirigert til Super Admin dashbordet.
              </p>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-400 mb-2">Super-bruker rettigheter:</h3>
                <ul className="text-sm text-blue-200 space-y-1 text-left">
                  <li>• Administrere alle organisasjoner</li>
                  <li>• Opprette og slette organisasjoner</li>
                  <li>• Administrere alle medlemmer og admins</li>
                  <li>• Systemkonfigurasjon og innstillinger</li>
                  <li>• Opprette andre super-brukere</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/super-admin', { replace: true })}
                  className="btn-primary"
                >
                  Gå til Super Admin Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-6">
                Din registrering som {
                  formData.role === 'admin' ? 'administrator' :
                  formData.role === 'range_officer' ? 'standplassleder' : 'medlem'
                } i <strong>{organization?.name || 'organisasjonen'}</strong> er nå sendt til godkjenning. 
                Du vil motta en e-post når tilgangen din er godkjent av en administrator.
              </p>
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-400 mb-2">Hva skjer nå?</h3>
                <ol className="text-sm text-blue-200 space-y-1 text-left">
                  <li>1. En administrator vil gjennomgå din registrering</li>
                  <li>2. Du får e-post når tilgangen er godkjent</li>
                  <li>3. Du kan da logge inn og begynne å bruke systemet</li>
                </ol>
              </div>
              <Link
                to={`/login?org=${orgSlug}`}
                className="btn-primary inline-flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake til innlogging
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

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
                backgroundColor: organization?.primary_color || '#FFD700', 
                color: organization?.secondary_color || '#1F2937' 
              }}
            >
              {needsSetup ? 'AKTIVLOGG' : (organization?.name || 'SVPK').split(' ').map(word => word[0]).join('').toUpperCase()}
            </div>
          )}
          <h1 
            className="text-2xl font-bold"
            style={{ color: organization?.primary_color || '#FFD700' }}
          >
            {needsSetup ? 'Første gangs oppsett' : `Bli medlem av ${organization?.name || 'organisasjonen'}`}
          </h1>
          <p className="text-gray-400 text-center mt-2">
            {needsSetup ? 'Opprett den første super-administratoren for systemet' : 'Registrer deg som nytt medlem'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fullt navn *
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post *
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
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Rolle *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' | 'range_officer' | 'super_user' }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                disabled={isLoading}
                required
              >
                <option value="member">Medlem</option>
                <option value="range_officer">Standplassleder</option>
                <option value="admin">Administrator</option>
                {needsSetup && (
                  <option value="super_user">Super-bruker (System Administrator)</option>
                )}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formData.role === 'super_user' 
                ? 'Super-bruker har full tilgang til hele systemet og alle organisasjoner'
                : formData.role === 'admin'
                ? 'Administrator kan administrere medlemmer og treningsøkter'
                : formData.role === 'range_officer'
                ? 'Standplassleder kan godkjenne treningsøkter'
                : 'Medlem kan registrere treningsøkter og se egen logg'
              }
            </p>
          </div>

          {formData.role !== 'super_user' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Skytter ID *
                </label>
                <a
                  href="https://app.skyting.no/user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:opacity-80 flex items-center gap-1"
                  style={{ color: organization?.primary_color || '#FFD700' }}
                >
                  <span>Finn din ID</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
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
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Finn din Skytter ID på skyting.no under "Min profil"
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2"
                placeholder="Minst 8 tegn"
                disabled={isLoading}
                required
                minLength={8}
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
              Bekreft passord *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2"
                placeholder="Gjenta passordet"
                disabled={isLoading}
                required
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

          {/* Role-specific information */}
          {formData.role === 'super_user' && needsSetup && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-400 mb-2">Super-bruker rettigheter</h4>
              <p className="text-sm text-blue-200 mb-2">
                Super-brukere har full tilgang til:
              </p>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Alle organisasjoner i systemet</li>
                <li>• Opprette og slette organisasjoner</li>
                <li>• Administrere alle medlemmer og admins</li>
                <li>• Systemkonfigurasjon og innstillinger</li>
                <li>• Opprette andre super-brukere</li>
              </ul>
            </div>
          )}

          {formData.role !== 'super_user' && (
            <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-200">
                  <p className="font-medium mb-1">Godkjenning påkrevd</p>
                  <p>
                    Alle registreringer må godkjennes av en eksisterende administrator før tilgang gis.
                    {formData.role === 'admin' && ' Administrator-tilgang krever ekstra verifisering.'}
                  </p>
                </div>
              </div>
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
                {formData.role === 'super_user' ? 'Oppretter super-bruker...' : 'Registrerer...'}
              </>
            ) : (
              formData.role === 'super_user' ? 'Opprett super-bruker' : 'Registrer deg'
            )}
          </button>

          <div className="text-center">
            <Link
              to={`/login?org=${orgSlug}`}
              className="flex items-center justify-center gap-2 hover:opacity-80"
              style={{ color: organization?.primary_color || '#FFD700' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til innlogging
            </Link>
          </div>
        </form>

        {needsSetup && (
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Første gangs oppsett:</strong> Dette oppsettet kan kun kjøres én gang. 
              Etter at den første super-brukeren er opprettet, vil super-bruker registrering kun være tilgjengelig for eksisterende super-brukere.
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <a 
            href="/landing.html" 
            target="_blank"
            className="text-yellow-400 hover:text-yellow-300 text-sm underline"
          >
            📄 Se AKTIVLOGG.no landingsside
          </a>
        </div>
      </div>
    </div>
  );
}
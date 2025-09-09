import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User, Hash, Loader2, AlertCircle, ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgSlug = searchParams.get('org') || 'svpk';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    memberNumber: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  // Static organization data - no database lookup needed
  const organization = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Svolvær Pistolklubb',
    slug: 'svpk',
    primary_color: '#FFD700',
    secondary_color: '#1F2937'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.email || !formData.password || !formData.confirmPassword || 
        !formData.fullName || !formData.memberNumber) {
      setError('Vennligst fyll ut alle felt');
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

    try {
      setIsLoading(true);
      console.log('📝 Submitting registration for:', formData.email);
      
      // Simple registration - save to localStorage for demo
      const newMember = {
        id: crypto.randomUUID(),
        organization_id: organization.id,
        email: formData.email,
        full_name: formData.fullName,
        member_number: formData.memberNumber,
        role: 'member',
        approved: false,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage
      const savedMembers = localStorage.getItem('members');
      const members = savedMembers ? JSON.parse(savedMembers) : [];
      
      // Check for duplicate email
      if (members.some((member: any) => member.email === formData.email)) {
        throw new Error('E-post er allerede registrert');
      }
      
      members.push(newMember);
      localStorage.setItem('members', JSON.stringify(members));
      
      console.log('✅ Registration successful');
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
            style={{ color: organization.primary_color }}
          >
            Registrering Mottatt
          </h1>
          <p className="text-gray-300 mb-6">
            Din registrering som medlem i <strong>{organization.name}</strong> er nå sendt til godkjenning. 
            Du vil motta en e-post når kontoen din er aktivert av en administrator.
          </p>
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-400 mb-2">Hva skjer nå?</h3>
            <ol className="text-sm text-blue-200 space-y-1 text-left">
              <li>1. En administrator vil gjennomgå din registrering</li>
              <li>2. Du får e-post når medlemskapet er godkjent</li>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div 
            className="h-16 px-6 flex items-center rounded font-bold text-2xl mb-6"
            style={{ 
              backgroundColor: organization.primary_color, 
              color: organization.secondary_color 
            }}
          >
            SVPK
          </div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: organization.primary_color }}
          >
            Bli medlem av {organization.name}
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Registrer deg som nytt medlem
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Skytter ID *
              </label>
              <a
                href="https://app.skyting.no/user"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:opacity-80 flex items-center gap-1"
                style={{ color: organization.primary_color }}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="Minst 8 tegn"
                disabled={isLoading}
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bekreft passord *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="Gjenta passordet"
                disabled={isLoading}
                required
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
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrerer...
              </>
            ) : (
              'Registrer som medlem'
            )}
          </button>

          <div className="text-center">
            <Link
              to={`/login?org=${orgSlug}`}
              className="flex items-center justify-center gap-2 hover:opacity-80"
              style={{ color: organization.primary_color }}
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til innlogging
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Kun for medlemmer</p>
                <p>
                  Denne registreringen er kun for medlemmer av {organization.name}. 
                  Etter registrering må en administrator godkjenne medlemskapet ditt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Lock, User, Hash, Loader2, AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getOrganizationBySlug } from '../lib/supabase';
import { sendMemberWelcomeEmail } from '../lib/emailService';
import type { Organization } from '../lib/types';

import { CheckCircle } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { register, login, branding } = useAuth();
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
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Load organization info
  React.useEffect(() => {
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
      await register(
        orgSlug,
        formData.email,
        formData.password,
        formData.fullName,
        formData.memberNumber
      );
      
      // Show registration success - user needs admin approval
      setRegistrationSubmitted(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Det oppstod en feil ved registrering');
      }
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
            style={{ color: organization?.primary_color || branding.primary_color }}
          >
            Registrering Mottatt
          </h1>
          <p className="text-gray-300 mb-6">
            Din registrering er nå sendt til godkjenning. Du vil motta en e-post når 
            kontoen din er aktivert av en administrator.
          </p>
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
            Registrer ny bruker
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Opprett en konto hos {organization?.name || 'organisasjonen'}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Skytter ID
              </label>
              <a
                href="https://app.skyting.no/user"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:opacity-80 flex items-center gap-1"
                style={{ color: organization?.primary_color || branding.primary_color }}
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
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bekreft passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )} ```
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
              'Registrer'
            )}
          </button>

          <Link
            to={`/login?org=${orgSlug}`}
            className="flex items-center justify-center gap-2 text-svpk-yellow hover:text-yellow-400"
            style={{ color: organization?.primary_color || branding.primary_color }}
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til innlogging
          </Link>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Shield className="w-5 h-5" />
            <p>
              Kun for medlemmer av {organization?.name || 'denne organisasjonen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
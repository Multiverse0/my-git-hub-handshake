import { useState, useEffect } from 'react';
import { X, AlertCircle, Search, User, Users } from 'lucide-react';
import type { OrganizationMember } from '../lib/types';
import { searchExistingUsers, addExistingUserToOrganization, getOrganizationMemberCount, getOrganizationById } from '../lib/supabase';
import { getMemberLimitInfo } from '../lib/subscriptionPlans';

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (member: Partial<OrganizationMember> & { sendWelcomeEmail?: boolean; password?: string }) => void;
  organizationId: string;
}

export function AddMemberModal({ onClose, onSave, organizationId }: AddMemberModalProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    member_number: string;
    role: 'member' | 'admin' | 'range_officer';
    password: string;
    confirmPassword: string;
    sendWelcomeEmail: boolean;
  }>({
    full_name: '',
    email: '',
    member_number: '',
    role: 'member',
    password: '',
    confirmPassword: '',
    sendWelcomeEmail: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<OrganizationMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberLimitInfo, setMemberLimitInfo] = useState<any>(null);

  // Load member limit info
  useEffect(() => {
    const loadLimitInfo = async () => {
      const currentCount = await getOrganizationMemberCount(organizationId);
      const { data: orgData } = await getOrganizationById(organizationId);
      const planId = orgData?.subscription_type || 'start';
      const limitInfo = getMemberLimitInfo(currentCount, planId);
      setMemberLimitInfo(limitInfo);
    };
    
    loadLimitInfo();
  }, [organizationId]);

  // Search for existing users when search term changes
  useEffect(() => {
    if (mode === 'existing' && searchTerm.length > 2) {
      const searchTimer = setTimeout(async () => {
        setSearching(true);
        const result = await searchExistingUsers(searchTerm);
        if (result.data) {
          setSearchResults(result.data);
        } else {
          setSearchResults([]);
        }
        setSearching(false);
      }, 300);

      return () => clearTimeout(searchTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, mode, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Check member limits before proceeding
      if (memberLimitInfo?.isAtLimit) {
        setError(`Medlemsgrensen for ${memberLimitInfo.plan.name} (${memberLimitInfo.limit} medlemmer) er nådd. Oppgrader abonnementet for å legge til flere medlemmer.`);
        return;
      }

      if (mode === 'new') {
        if (!formData.full_name.trim() || !formData.email.trim()) {
          setError('Navn og e-post må fylles ut');
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Ugyldig e-postadresse');
          return;
        }
        
        // Validate password
        if (!formData.password.trim()) {
          setError('Passord må fylles ut');
          return;
        }
        
        if (formData.password.length < 6) {
          setError('Passordet må være minst 6 tegn');
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passordene er ikke like');
          return;
        }
        
        onSave({
          full_name: formData.full_name.trim(),
          email: formData.email.toLowerCase().trim(),
          member_number: formData.member_number.trim() || undefined,
          role: formData.role,
          password: formData.password.trim(),
          approved: true, // Auto-approve members added by admin
          active: true,
          sendWelcomeEmail: formData.sendWelcomeEmail,
        });
      } else if (mode === 'existing' && selectedUser) {
        // Add existing user to organization
        const result = await addExistingUserToOrganization(
          selectedUser.email,
          organizationId,
          selectedUser.full_name,
          formData.member_number,
          formData.role
        );
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        // Trigger refresh of member list
        onSave(result.data!);
      } else {
        setError('Velg en bruker å legge til');
        return;
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Det oppstod en feil');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: OrganizationMember) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      full_name: user.full_name,
      email: user.email,
      member_number: user.member_number || ''
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {mode === 'new' ? 'Legg til nytt medlem' : 'Legg til eksisterende bruker'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Toggle */}
          {/* Member Limit Warning */}
          {memberLimitInfo && (memberLimitInfo.isNearLimit || memberLimitInfo.isAtLimit) && (
            <div className={`p-3 rounded-lg mb-4 ${
              memberLimitInfo.isAtLimit 
                ? 'bg-red-900/50 border border-red-700 text-red-200' 
                : 'bg-yellow-900/50 border border-yellow-700 text-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div className="text-sm">
                  {memberLimitInfo.isAtLimit ? (
                    <p>Medlemsgrensen for {memberLimitInfo.plan.name} ({memberLimitInfo.limit} medlemmer) er nådd.</p>
                  ) : (
                    <p>Du har {memberLimitInfo.remaining} medlemsplasser igjen av {memberLimitInfo.limit}.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('new');
                setSelectedUser(null);
                setSearchTerm('');
                setFormData({ full_name: '', email: '', member_number: '', role: 'member', password: '', confirmPassword: '', sendWelcomeEmail: true });
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                mode === 'new'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Ny bruker
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('existing');
                setSelectedUser(null);
                setSearchTerm('');
                setFormData({ full_name: '', email: '', member_number: '', role: 'member', password: '', confirmPassword: '', sendWelcomeEmail: true });
              }}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                mode === 'existing'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Eksisterende bruker
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Søk etter eksisterende bruker *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 rounded-md pl-10 pr-3 py-2"
                    placeholder="Søk på navn eller e-postadresse..."
                  />
                </div>
                
                {/* Search Results */}
                {searchTerm.length > 2 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-600 rounded-md">
                    {searching ? (
                      <div className="p-3 text-center text-gray-400">Søker...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className={`w-full text-left p-2 rounded text-sm hover:bg-gray-600 transition-colors ${
                              selectedUser?.id === user.id ? 'bg-gray-600' : ''
                            }`}
                          >
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-gray-400 text-xs">{user.email}</div>
                            {user.member_number && (
                              <div className="text-gray-500 text-xs">ID: {user.member_number}</div>
                            )}
                            <div className="text-gray-500 text-xs">Organisasjon: {(user as any).organizations?.name || 'Ukjent'}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-gray-400">Ingen brukere funnet</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'new' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fullt navn *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full bg-gray-700 rounded-md px-3 py-2"
                    placeholder="Skriv inn fullt navn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    E-postadresse *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-700 rounded-md px-3 py-2"
                    placeholder="navn@example.com"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SkytterID (valgfritt)
              </label>
              <input
                type="text"
                value={formData.member_number}
                onChange={(e) => setFormData(prev => ({ ...prev, member_number: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="Skriv inn SkytterID"
              />
            </div>

            {mode === 'new' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Passord *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-gray-700 rounded-md px-3 py-2"
                    placeholder="Skriv inn passord (min 6 tegn)"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bekreft passord *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-gray-700 rounded-md px-3 py-2"
                    placeholder="Skriv inn passordet på nytt"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' | 'range_officer' }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                disabled
              >
                <option value="member">Medlem</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">Alle nye brukere starter som medlemmer</p>
            </div>

            {mode === 'new' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary focus:ring-offset-gray-800"
                />
                <label htmlFor="sendWelcomeEmail" className="text-sm text-gray-300">
                  Send velkomst-e-post med innloggingsdetaljer
                </label>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || (mode === 'existing' && !selectedUser) || memberLimitInfo?.isAtLimit}
              >
                {loading ? 'Legger til...' : mode === 'new' ? 'Legg til medlem' : 'Legg til eksisterende medlem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
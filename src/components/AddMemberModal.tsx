import { useState, useEffect } from 'react';
import { X, AlertCircle, Search, User, Users } from 'lucide-react';
import type { OrganizationMember } from '../lib/types';
import { searchExistingUsers, addExistingUserToOrganization } from '../lib/supabase';

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (member: Partial<OrganizationMember>) => void;
  organizationId: string;
}

export function AddMemberModal({ onClose, onSave, organizationId }: AddMemberModalProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    member_number: string;
    role: 'member' | 'admin' | 'range_officer';
  }>({
    full_name: '',
    email: '',
    member_number: '',
    role: 'member',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<OrganizationMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Search for existing users when search term changes
  useEffect(() => {
    if (mode === 'existing' && searchTerm.length > 2) {
      const searchTimer = setTimeout(async () => {
        setSearching(true);
        const result = await searchExistingUsers(searchTerm, organizationId);
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
        
        onSave({
          full_name: formData.full_name.trim(),
          email: formData.email.toLowerCase().trim(),
          member_number: formData.member_number.trim() || undefined,
          role: formData.role,
          approved: true, // Auto-approve members added by admin
          active: true,
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
          <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('new');
                setSelectedUser(null);
                setSearchTerm('');
                setFormData({ full_name: '', email: '', member_number: '', role: 'member' });
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
                setFormData({ full_name: '', email: '', member_number: '', role: 'member' });
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
                    type="email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 rounded-md pl-10 pr-3 py-2"
                    placeholder="Søk på e-postadresse..."
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' | 'range_officer' }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
                <option value="range_officer">Standplassleder</option>
              </select>
            </div>

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
                disabled={loading || (mode === 'existing' && !selectedUser)}
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
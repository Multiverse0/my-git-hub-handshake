import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function OrganizationSelector() {
  const { user, organization, switchOrganization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Only show for super users in navigation
  if (!user || user.user_type !== 'super_user') {
    return null;
  }

  // Load available organizations from database
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('slug, name')
          .eq('active', true)
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error loading organizations:', error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const handleSwitch = async (orgSlug: string) => {
    try {
      setSwitching(true);
      await switchOrganization(orgSlug);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching organization:', error);
      alert('Kunne ikke bytte organisasjon');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        disabled={switching}
      >
        <Building2 className="w-4 h-4" />
        <span className="hidden sm:inline">
          {organization?.name || 'Velg organisasjon'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 mb-1">
              Super-bruker: Bytt organisasjon
            </div>
            {loading ? (
              <div className="px-2 py-2 text-gray-400 text-sm">Laster...</div>
            ) : organizations.length === 0 ? (
              <div className="px-2 py-2 text-gray-400 text-sm">Ingen organisasjoner funnet</div>
            ) : (
              organizations.map((org) => (
              <button
                key={org.slug}
                onClick={() => handleSwitch(org.slug)}
                className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-700 rounded text-sm transition-colors"
                disabled={switching}
              >
                <span>{org.name}</span>
                {organization?.slug === org.slug && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
              </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
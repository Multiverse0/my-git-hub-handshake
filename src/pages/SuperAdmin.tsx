import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Shield, AlertCircle, X, Loader2, Eye, EyeOff, Copy, Save, Package, Globe } from 'lucide-react';
import { supabase, createOrganization } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { useAuth } from '../contexts/AuthContext';
import type { Organization } from '../lib/types';
import { ThemeToggle } from '../components/ThemeToggle';
import { DataExportManager } from '../components/DataExportManager';
import { LanguageFileManager } from '../components/LanguageFileManager';
import { SupabaseStatus } from '../components/SupabaseStatus';

interface OrganizationWithStats extends Organization {
  member_count: number;
  admin_count: number;
}

interface CreateSuperUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateSuperUserModal({ onClose, onSuccess }: CreateSuperUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(formData.password, 10);

      // Create new super user
      const newSuperUser = {
        id: crypto.randomUUID(),
        email: formData.email,
        full_name: formData.full_name,
        password_hash: passwordHash,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage
      const existingSuperUsers = localStorage.getItem('superUsers');
      const superUsers = existingSuperUsers ? JSON.parse(existingSuperUsers) : [];
      
      // Check for duplicate email
      if (superUsers.some((user: any) => user.email === formData.email)) {
        throw new Error('E-post er allerede registrert som super-bruker');
      }
      
      superUsers.push(newSuperUser);
      localStorage.setItem('superUsers', JSON.stringify(superUsers));

      onSuccess();
    } catch (error) {
      console.error('Error creating super user:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke opprette super-bruker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Opprett ny Super-bruker</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fullt navn *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                placeholder="Ola Nordmann"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-post *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Passord *
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-sm text-svpk-yellow hover:text-yellow-400"
                >
                  Generer nytt
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 pr-20"
                  required
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1 text-gray-400 hover:text-white"
                    title="Kopier passord"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Sterkt passord generert automatisk. Du kan endre det hvis nødvendig.
              </p>
            </div>

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

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Opprett Super-bruker
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface CreateOrgModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateOrgModal({ onClose, onSuccess }: CreateOrgModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    primary_color: '#FFD700',
    secondary_color: '#1F2937',
    admin_notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create organization with unique ID
      const newOrganization = {
        id: crypto.randomUUID(),
        ...formData,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage for demo (in production, this would use Supabase)
      const savedOrgs = localStorage.getItem('organizations');
      const organizations = savedOrgs ? JSON.parse(savedOrgs) : [];
      
      // Check for duplicate slug
      if (organizations.some((org: any) => org.slug === formData.slug)) {
        throw new Error('URL-slug er allerede i bruk. Velg en annen.');
      }
      
      organizations.push(newOrganization);
      localStorage.setItem('organizations', JSON.stringify(organizations));

      onSuccess();
    } catch (error) {
      console.error('Error creating organization:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke opprette organisasjon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Opprett ny organisasjon</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Organisasjonsnavn *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                  }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  URL-slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Beskrivelse
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-24"
                placeholder="Kort beskrivelse av organisasjonen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Admin-notater (kun for super-admin)
              </label>
              <textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-32"
                placeholder="Avtalt månedspris, kontaktperson, kontaktinfo, etc."
              />
              <p className="text-xs text-gray-400 mt-1">
                Disse notatene er kun synlige for super-administratorer
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nettside
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  E-post
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Primærfarge
                </label>
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 h-10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Sekundærfarge
                </label>
                <input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 h-10"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Opprett organisasjon
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface EditSuperUserModalProps {
  superUser: any;
  onClose: () => void;
  onSuccess: () => void;
}

function EditSuperUserModal({ superUser, onClose, onSuccess }: EditSuperUserModalProps) {
  const [formData, setFormData] = useState({
    email: superUser.email,
    full_name: superUser.full_name,
    active: superUser.active,
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [generateNewPassword, setGenerateNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    setGenerateNewPassword(true);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Update super user
      const savedSuperUsers = localStorage.getItem('superUsers');
      if (savedSuperUsers) {
        const superUsers = JSON.parse(savedSuperUsers);
        const updatedSuperUsers = await Promise.all(superUsers.map(async (user: any) => {
          if (user.id === superUser.id) {
            const updatedUser = { ...user, ...formData, updated_at: new Date().toISOString() };
            
            // Hash new password if provided
            if (formData.password && generateNewPassword) {
              updatedUser.password_hash = await bcrypt.hash(formData.password, 10);
            }
            
            return updatedUser;
          }
          return user;
        }));
        localStorage.setItem('superUsers', JSON.stringify(updatedSuperUsers));
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating super user:', error);
      setError('Kunne ikke oppdatere super-bruker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Rediger Super-bruker</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fullt navn *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-post *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <span className="text-sm font-medium text-gray-300">Aktiv super-bruker</span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Inaktive super-brukere kan ikke logge inn eller administrere systemet
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Nytt passord (valgfritt)
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-sm text-svpk-yellow hover:text-yellow-400"
                >
                  Generer nytt
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    setGenerateNewPassword(true);
                  }}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 pr-20"
                  placeholder="La stå tom for å beholde eksisterende"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {formData.password && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Kopier passord"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                La feltet stå tomt for å beholde eksisterende passord
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Lagre endringer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function SuperAdmin() {
  const { user, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSuperUser, setShowCreateSuperUser] = useState(false);
  const [superUsers, setSuperUsers] = useState<any[]>([]);
  const [, setSelectedOrg] = useState<string | null>(null);
  const [editingSuperUser, setEditingSuperUser] = useState<any | null>(null);
  const [exportingOrg, setExportingOrg] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'languages'>('organizations');

  // Only allow super users
  if (!user || user.user_type !== 'super_user') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Ingen tilgang</h1>
          <p className="text-gray-400">Kun super-brukere har tilgang til dette området</p>
        </div>
      </div>
    );
  }

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Load organizations from database
      const { data: allOrganizations, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get member counts for each organization from database
      const organizationsWithStats = await Promise.all(
        (allOrganizations || []).map(async (org: Organization) => {
          const { data: members } = await supabase
            .from('organization_members')
            .select('id, role')
            .eq('organization_id', org.id);
          
          const memberCount = members?.length || 0;
          const adminCount = members?.filter(m => m.role === 'admin').length || 0;
          
          return {
            ...org,
            member_count: memberCount,
            admin_count: adminCount
          };
        })
      );
        
      setOrganizations(organizationsWithStats);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperUsers = () => {
    try {
      const loadUsers = async () => {
        const { data: users, error } = await supabase
          .from('super_users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading super users:', error);
          setSuperUsers([]);
        } else {
          setSuperUsers(users || []);
        }
      };
      
      loadUsers();
    } catch (error) {
      console.error('Error in loadSuperUsers:', error);
      setSuperUsers([]);
    }
  };

  // Commented out unused functions
  // const _handleCreateOrganization = async (orgData: any) => {
    try {
      const result = await createOrganization(orgData);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Refresh organizations list
      loadOrganizations();
      return result.data;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadSuperUsers();
    
    // Listen for changes in localStorage to update stats
    const handleStorageChange = () => {
      loadOrganizations();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates periodically
    const interval = setInterval(() => {
      loadOrganizations();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // const _handleSwitchToOrg = async (orgSlug: string) => {
    try {
      setSelectedOrg(orgSlug);
      await switchOrganization(orgSlug);
      // Navigate to admin page after switching
      navigate('/admin');
    } catch (error) {
      console.error('Error switching organization:', error);
      setSelectedOrg(null);
      alert('Kunne ikke bytte til organisasjon');
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    // First show export option
    const shouldExport = window.confirm(
      `VIKTIG: Før du sletter organisasjonen "${orgName}", bør du eksportere alle data.\n\n` +
      `Vil du eksportere data først? (Anbefalt)\n\n` +
      `Klikk OK for å eksportere data, eller Avbryt for å slette uten eksport.`
    );

    if (shouldExport) {
      setExportingOrg({ id: orgId, name: orgName });
      return;
    }

    // Confirm deletion without export
    if (!window.confirm(`Er du HELT SIKKER på at du vil slette organisasjonen "${orgName}" UTEN å eksportere data?\n\nDette vil slette alle medlemmer og data PERMANENT og kan ikke angres.`)) {
      return;
    }

    performOrgDeletion(orgId);
  };

  const performOrgDeletion = async (orgId: string) => {
    try {
      // Delete from localStorage
      const savedOrgs = localStorage.getItem('organizations');
      if (savedOrgs) {
        const organizations = JSON.parse(savedOrgs);
        const updatedOrganizations = organizations.filter((org: any) => org.id !== orgId);
        localStorage.setItem('organizations', JSON.stringify(updatedOrganizations));
        
        // Also remove any members associated with this organization
        const savedMembers = localStorage.getItem('members');
        if (savedMembers) {
          const members = JSON.parse(savedMembers);
          const updatedMembers = members.filter((member: any) => member.organization_id !== orgId);
          localStorage.setItem('members', JSON.stringify(updatedMembers));
        }
      }
      
      loadOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Kunne ikke slette organisasjon');
    }
  };

  const handleToggleSuperUserActive = (userId: string) => {
    const superUser = superUsers.find(u => u.id === userId);
    if (!superUser) return;
    
    const action = superUser.active ? 'deaktivere' : 'aktivere';
    
    if (window.confirm(`Er du sikker på at du vil ${action} super-brukeren "${superUser.full_name}"?`)) {
      try {
        const savedSuperUsers = localStorage.getItem('superUsers');
        if (savedSuperUsers) {
          const users = JSON.parse(savedSuperUsers);
          const updatedUsers = users.map((u: any) => 
            u.id === userId ? { ...u, active: !u.active, updated_at: new Date().toISOString() } : u
          );
          localStorage.setItem('superUsers', JSON.stringify(updatedUsers));
          setSuperUsers(updatedUsers);
        }
      } catch (error) {
        console.error('Error toggling super user status:', error);
        alert('Kunne ikke endre status for super-bruker');
      }
    }
  };

  const handleDeleteSuperUser = (userId: string, userName: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette super-brukeren "${userName}"? Dette kan ikke angres.`)) {
      return;
    }

    try {
      const savedSuperUsers = localStorage.getItem('superUsers');
      if (savedSuperUsers) {
        const users = JSON.parse(savedSuperUsers);
        const updatedUsers = users.filter((u: any) => u.id !== userId);
        localStorage.setItem('superUsers', JSON.stringify(updatedUsers));
        setSuperUsers(updatedUsers);
      }
    } catch (error) {
      console.error('Error deleting super user:', error);
      alert('Kunne ikke slette super-bruker');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-svpk-yellow">Super Admin</h1>
              <p className="text-gray-400">Administrer alle organisasjoner i systemet</p>
            </div>
            <div className="flex items-center gap-4">
              <SupabaseStatus showDetails={false} />
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <ThemeToggle />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Ny organisasjon
              </button>
              <button
                onClick={() => setShowCreateSuperUser(true)}
                className="btn-secondary"
              >
                <Shield className="w-5 h-5" />
                Ny Super-bruker
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-700 mt-6">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'organizations'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Organisasjoner
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'languages'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Språkfiler
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'languages'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Språkfiler
            </button>
          </div>
        </header>

        {activeTab === 'languages' && (
          <LanguageFileManager />
        )}

        {activeTab === 'languages' && (
          <LanguageFileManager />
        )}

        {activeTab === 'organizations' && (
          <>

        {/* Super Users Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-svpk-yellow">Super-brukere</h2>
              <p className="text-gray-400">Administrer brukere med full systemtilgang</p>
            </div>
          </div>

          <div className="card">
            {superUsers.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Ingen super-brukere funnet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left">Navn</th>
                      <th className="py-3 px-4 text-left">E-post</th>
                      <th className="py-3 px-4 text-left">Opprettet</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-right">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {superUsers.map((superUser) => (
                      <tr key={superUser.id} className="border-b border-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-svpk-yellow" />
                            <span className="font-medium">{superUser.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{superUser.email}</td>
                        <td className="py-3 px-4">
                          {new Date(superUser.created_at).toLocaleDateString('nb-NO')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            superUser.active 
                              ? 'bg-green-900/50 text-green-400' 
                              : 'bg-red-900/50 text-red-400'
                          }`}>
                            {superUser.active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingSuperUser(superUser)}
                              className="p-2 text-blue-400 hover:text-blue-300"
                              title="Rediger super-bruker"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSuperUserActive(superUser.id)}
                              className={`p-2 transition-colors ${
                                superUser.active 
                                  ? 'text-green-400 hover:text-green-300' 
                                  : 'text-red-400 hover:text-red-300'
                              }`}
                              title={superUser.active ? 'Aktiv super-bruker' : 'Inaktiv super-bruker'}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSuperUser(superUser.id, superUser.full_name)}
                              className="p-2 text-red-400 hover:text-red-300"
                              title="Slett super-bruker"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-svpk-yellow">Organisasjoner</h2>
          <p className="text-gray-400">Administrer alle organisasjoner i systemet</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-svpk-yellow animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div key={org.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img 
                        src={org.logo_url} 
                        alt={`${org.name} logo`}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded flex items-center justify-center text-sm font-bold"
                        style={{ 
                          backgroundColor: org.primary_color,
                          color: org.secondary_color 
                        }}
                      >
                        {org.name.split(' ').map(word => word[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{org.name}</h3>
                      <p className="text-sm text-gray-400">/{org.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteOrg(org.id, org.name)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Slett organisasjon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {org.description && (
                  <p className="text-gray-300 text-sm mb-4">{org.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Medlemmer:</span>
                    <span className="font-medium">{org.member_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Admins:</span>
                    <span className="font-medium">{org.admin_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium ${org.active ? 'text-green-400' : 'text-red-400'}`}>
                      {org.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Abonnement:</span>
                    <span className="font-medium text-svpk-yellow">
                      {org.subscription_plan === 'starter' ? 'Starter (Kr 299)' : 'Professional (Kr 599)'}
                    </span>
                  </div>
                  {org.admin_notes && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-xs text-gray-400 mb-2">Admin-notater:</div>
                      <div className="text-xs text-gray-300 bg-gray-700 p-2 rounded whitespace-pre-line">
                        {org.admin_notes}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/organization/${org.id}`)}
                    className="btn-primary"
                  >
                    <Settings className="w-4 h-4" />
                    Administrer
                  </button>
                  <button
                    onClick={() => setExportingOrg({ id: org.id, name: org.name })}
                    className="btn-secondary"
                    title="Eksporter organisasjonsdata"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExportingOrg({ id: org.id, name: org.name })}
                    className="btn-secondary"
                    title="Eksporter organisasjonsdata"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateSuperUser && (
          <CreateSuperUserModal
            onClose={() => setShowCreateSuperUser(false)}
            onSuccess={() => {
              setShowCreateSuperUser(false);
              loadSuperUsers();
            }}
          />
        )}
        {showCreateModal && (
          <CreateOrgModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadOrganizations();
            }}
          />
        )}

        {editingSuperUser && (
          <EditSuperUserModal
            superUser={editingSuperUser}
            onClose={() => setEditingSuperUser(null)}
            onSuccess={() => {
              setEditingSuperUser(null);
              loadSuperUsers();
            }}
          />
        )}

        {exportingOrg && (
          <DataExportManager
            organizationId={exportingOrg.id}
            organizationName={exportingOrg.name}
            onClose={() => setExportingOrg(null)}
          />
        )}

        {exportingOrg && (
          <DataExportManager
            organizationId={exportingOrg.id}
            organizationName={exportingOrg.name}
            onClose={() => setExportingOrg(null)}
          />
        )}
          </>
        )}
      </div>
    </div>
  );
}
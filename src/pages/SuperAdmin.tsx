import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Shield, AlertCircle, X, Loader2, Eye, EyeOff, Copy, Save, Package, Globe, Users, CheckCircle, Mail } from 'lucide-react';
import { supabase, createOrganization, setUserContext } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { useAuth } from '../contexts/AuthContext';
import type { Organization } from '../lib/types';
import { ThemeToggle } from '../components/ThemeToggle';
import { EmailManagement } from '../components/EmailManagement';
import { DataExportManager } from '../components/DataExportManager';
import { LanguageFileManager } from '../components/LanguageFileManager';
import { SupabaseStatus } from '../components/SupabaseStatus';
import { StatisticsCard } from '../components/StatisticsCard';

interface OrganizationWithStats extends Organization {
  member_count: number;
  admin_count: number;
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_expires_at?: string | null;
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
      // Hash password for future use if needed
      await bcrypt.hash(formData.password, 10);

      // Create new super user in Supabase
      const { error: insertError } = await supabase
        .from('super_users')
        .insert({
          email: formData.email,
          full_name: formData.full_name,
          active: true
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('E-post er allerede registrert som super-bruker');
        }
        throw insertError;
      }

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
  const { user } = useAuth();
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
      // Validate form data
      if (!formData.name || !formData.slug) {
        throw new Error('Navn og slug er påkrevd');
      }

      // Ensure user is authenticated
      if (!user?.email) {
        throw new Error('Du må være innlogget for å opprette organisasjoner');
      }

      console.log('Setting user context for:', user.email);
      
      // Set user context for RLS policies
      await setUserContext(user.email);

      console.log('Creating organization with data:', formData);

      // Use the centralized createOrganization function
      const result = await createOrganization({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        website: formData.website,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        nsf_enabled: true,
        dfs_enabled: true,
        dssn_enabled: true,
        activity_types: ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun']
      });

      if (result.error) {
        if (result.error.includes('duplicate key') || result.error.includes('23505')) {
          throw new Error('URL-slug er allerede i bruk. Velg en annen.');
        }
        throw new Error(result.error);
      }

      console.log('Organization created successfully:', result.data);
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
                  value={formData.primary_color || ''}
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
                  value={formData.secondary_color || ''}
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
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: any = {
        email: formData.email,
        full_name: formData.full_name,
        active: formData.active,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('super_users')
        .update(updateData)
        .eq('id', superUser.id);

      if (error) {
        throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating super user:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke oppdatere super-bruker');
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
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded"
                />
                Aktiv bruker
              </label>
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
  const { switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateSuperUser, setShowCreateSuperUser] = useState(false);
  const [superUsers, setSuperUsers] = useState<any[]>([]);
  const [, setSelectedOrg] = useState<string | null>(null);
  const [editingSuperUser, setEditingSuperUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'languages' | 'email'>('organizations');
  const [exportingOrg, setExportingOrg] = useState<{ id: string; name: string } | null>(null);
  
  // Statistics state
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalSuperAdmins: 0
  });

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Load from Supabase with subscription info
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*, subscription_type, subscription_status, subscription_expires_at')
        .order('created_at', { ascending: false });

      if (orgsError && orgsError.code !== 'PGRST116') {
        throw new Error(orgsError.message);
      }
      
      let orgsWithStats: OrganizationWithStats[];
      
      if (orgsData && orgsData.length > 0) {
        // Add member and admin counts from Supabase
        orgsWithStats = await Promise.all(orgsData.map(async (org) => {
          const [memberResult, adminResult] = await Promise.all([
            supabase.from('organization_members').select('id', { count: 'exact' }).eq('organization_id', org.id),
            supabase.from('organization_members').select('id', { count: 'exact' }).eq('organization_id', org.id).eq('role', 'admin')
          ]);
          
          return {
            ...org,
            member_count: memberResult.count || 0,
            admin_count: adminResult.count || 0
          };
        }));
      } else {
        // Fallback to localStorage
        const savedOrgs = localStorage.getItem('organizations');
        const savedMembers = localStorage.getItem('members');
        const savedUsers = localStorage.getItem('users');
        
        const orgs = savedOrgs ? JSON.parse(savedOrgs) : [];
        const members = savedMembers ? JSON.parse(savedMembers) : [];
        const users = savedUsers ? JSON.parse(savedUsers) : [];
        
        orgsWithStats = orgs.map((org: any) => ({
          ...org,
          member_count: members.filter((m: any) => m.organization_id === org.id).length,
          admin_count: users.filter((u: any) => u.organization_id === org.id && u.role === 'admin').length
        }));
      }
      
      setOrganizations(orgsWithStats);
      
      // Calculate statistics
      const totalOrgs = orgsWithStats.length;
      const activeOrgs = orgsWithStats.filter(org => org.active).length;
      const totalUsers = orgsWithStats.reduce((sum, org) => sum + org.member_count, 0);
      
      setStats({
        totalOrganizations: totalOrgs,
        activeOrganizations: activeOrgs,
        totalUsers,
        totalSuperAdmins: 0 // Will be updated when super users are loaded
      });
    } catch (error) {
      console.error('Error loading organizations:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadSuperUsers = async () => {
    try {
      const { data: superUsersData, error } = await supabase
        .from('super_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading super users from database:', error);
        // Fallback to localStorage if database fails
        const savedSuperUsers = localStorage.getItem('superUsers');
        if (savedSuperUsers) {
          const users = JSON.parse(savedSuperUsers);
          setSuperUsers(users || []);
        } else {
          setSuperUsers([]);
        }
      } else {
        setSuperUsers(superUsersData || []);
        
        // Update super admin count in stats
        setStats((prev: typeof stats) => ({
          ...prev,
          totalSuperAdmins: (superUsersData || []).filter(su => su.active).length
        }));
      }
    } catch (error) {
      console.error('Error loading super users:', error);
      setSuperUsers([]);
    }
  };


  useEffect(() => {
    const loadData = async () => {
      await loadOrganizations();
      await loadSuperUsers();
    };

    loadData();

    // Listen for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Refresh data periodically
    const interval = setInterval(() => {
      loadOrganizations();
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSwitchToOrg = async (orgSlug: string) => {
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

    try {
      // Delete from Supabase first
      await supabase.from('organizations').delete().eq('id', orgId);
      
      // Also remove from localStorage
      const savedOrgs = localStorage.getItem('organizations');
      if (savedOrgs) {
        const orgs = JSON.parse(savedOrgs);
        const updatedOrgs = orgs.filter((org: any) => org.id !== orgId);
        localStorage.setItem('organizations', JSON.stringify(updatedOrgs));
        
        // Clean up related data
        const savedMembers = localStorage.getItem('members');
        if (savedMembers) {
          const members = JSON.parse(savedMembers);
          const updatedMembers = members.filter((member: any) => member.organization_id !== orgId);
          localStorage.setItem('members', JSON.stringify(updatedMembers));
        }
      }
      
      await loadOrganizations();
      alert(`Organisasjonen "${orgName}" ble slettet.`);
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Kunne ikke slette organisasjon');
    }
  };

  const handleToggleSuperUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('super_users')
        .update({ 
          active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadSuperUsers();
    } catch (error) {
      console.error('Error toggling super user status:', error);
      alert('Kunne ikke endre status for super-bruker');
    }
  };

  const handleDeleteSuperUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Er du sikker på at du vil slette super-brukeren "${userName}"?\n\nDette kan ikke angres.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('super_users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      await loadSuperUsers();
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
              <SupabaseStatus iconOnly={true} />
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
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'email'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              E-post
            </button>
          </div>
        </header>

        {activeTab === 'languages' && (
          <LanguageFileManager />
        )}

        {activeTab === 'email' && (
          <EmailManagement />
        )}

        {activeTab === 'organizations' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatisticsCard
                title="Totale organisasjoner"
                value={stats.totalOrganizations}
                icon={Building2}
                color="yellow"
              />
              <StatisticsCard
                title="Aktive organisasjoner"
                value={stats.activeOrganizations}
                icon={CheckCircle}
                color="green"
              />
              <StatisticsCard
                title="Totale brukere"
                value={stats.totalUsers}
                icon={Users}
                color="blue"
              />
              <StatisticsCard
                title="Super-administratorer"
                value={stats.totalSuperAdmins}
                icon={Shield}
                color="purple"
              />
            </div>

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
                          <tr key={superUser.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="py-3 px-4 font-medium">{superUser.full_name}</td>
                            <td className="py-3 px-4 text-gray-300">{superUser.email}</td>
                            <td className="py-3 px-4 text-gray-400">
                              {new Date(superUser.created_at).toLocaleDateString('no-NO')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                superUser.active
                                  ? 'bg-green-900/50 text-green-300 border border-green-700'
                                  : 'bg-red-900/50 text-red-300 border border-red-700'
                              }`}>
                                {superUser.active ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingSuperUser(superUser)}
                                  className="p-2 text-gray-400 hover:text-svpk-yellow transition-colors"
                                  title="Rediger super-bruker"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleSuperUserStatus(superUser.id, superUser.active)}
                                  className={`p-2 transition-colors ${
                                    superUser.active
                                      ? 'text-yellow-400 hover:text-yellow-300'
                                      : 'text-green-400 hover:text-green-300'
                                  }`}
                                  title={superUser.active ? 'Deaktiver' : 'Aktiver'}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSuperUser(superUser.id, superUser.full_name)}
                                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
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

            {/* Organizations Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-svpk-yellow">Organisasjoner</h2>
                  <p className="text-gray-400">Administrer alle organisasjoner i systemet</p>
                </div>
              </div>

              {loading ? (
                <div className="card">
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-svpk-yellow mx-auto mb-4" />
                    <p className="text-gray-400">Laster organisasjoner...</p>
                  </div>
                </div>
              ) : organizations.length === 0 ? (
                <div className="card">
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Ingen organisasjoner funnet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn-primary"
                    >
                      <Plus className="w-5 h-5" />
                      Opprett første organisasjon
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                                backgroundColor: org.primary_color || '#FFD700',
                                color: org.secondary_color || '#1F2937'
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
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-svpk-yellow">{org.member_count}</div>
                            <div className="text-xs text-gray-400">Medlemmer</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-svpk-yellow">{org.admin_count}</div>
                            <div className="text-xs text-gray-400">Admins</div>
                          </div>
                          <div className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              org.active
                                ? 'bg-green-900/50 text-green-300 border border-green-700'
                                : 'bg-red-900/50 text-red-300 border border-red-700'
                            }`}>
                              {org.active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">Status</div>
                          </div>
                          <div className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (org.subscription_type || 'starter') === 'enterprise'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                : (org.subscription_type || 'starter') === 'professional'
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-700'
                                : 'bg-gray-900/50 text-gray-300 border border-gray-700'
                            }`}>
                              {(org.subscription_type || 'starter') === 'enterprise' ? 'Enterprise' : 
                               (org.subscription_type || 'starter') === 'professional' ? 'Professional' : 'Starter'}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">Abonnement</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSwitchToOrg(org.slug)}
                              className="btn-secondary"
                            >
                              <Building2 className="w-4 h-4" />
                              Administrer
                            </button>
                            <button
                              onClick={() => setExportingOrg({ id: org.id, name: org.name })}
                              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Eksporter data"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrg(org.id, org.name)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Slett organisasjon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {org.admin_notes && (
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-400 mb-1">Admin-notater</h4>
                          <p className="text-sm text-blue-200 whitespace-pre-wrap">{org.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
      </div>
    </div>
  );
}
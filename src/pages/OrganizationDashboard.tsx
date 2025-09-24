import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Settings, UserPlus, Eye, EyeOff, Copy, CheckCircle, AlertCircle, Loader2, Shield, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addOrganizationMember, updateMemberRole, updateOrganizationMember, getOrganizationById, getOrganizationAdmins, supabase } from '../lib/supabase';
import { sendAdminWelcomeEmail } from '../lib/emailService';
import { OrganizationAdmin } from '../lib/types';
import { OrganizationSettings } from '../components/OrganizationSettings';
import { MembershipProgressCard } from '../components/MembershipProgressCard';

interface CreateAdminModalProps {
  organizationId: string;
  organizationName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditAdminModalProps {
  admin: OrganizationAdmin;
  organizationName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditAdminModal({ admin, organizationName, onClose, onSuccess }: EditAdminModalProps) {
  const [formData, setFormData] = useState({
    email: admin.email,
    full_name: admin.full_name,
    active: admin.active,
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
      // Prepare update data
      const updateData: any = {
        email: formData.email,
        full_name: formData.full_name,
        active: formData.active,
        updated_at: new Date().toISOString()
      };

      // Only include password hash if new password was generated
      if (formData.password && generateNewPassword) {
        // Note: In production, password hashing should be done server-side
        updateData.password_hash = formData.password;
      }

      // Update admin using Supabase
      const result = await updateOrganizationMember(admin.id, updateData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      onSuccess();
    } catch (error) {
      console.error('Error updating admin:', error);
      setError('Kunne ikke oppdatere admin-bruker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Rediger Admin for {organizationName}</h3>
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
                  checked={formData.active || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <span className="text-sm font-medium text-gray-300">Aktiv admin</span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Inaktive admins kan ikke logge inn eller administrere organisasjonen
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

function CreateAdminModal({ organizationId, organizationName, onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: organizationName ? `Admin for ${organizationName}` : '',
    password: '',
    member_number: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create admin user using Supabase
      const result = await addOrganizationMember(organizationId, {
        email: formData.email,
        full_name: formData.full_name,
        member_number: formData.member_number,
        role: 'admin',
        approved: true,
        password: formData.password
      });
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Send welcome email
      const loginUrl = `${window.location.origin}/login?org=${organizationId}`;
      try {
        const emailResult = await sendAdminWelcomeEmail(
          formData.email,
          formData.full_name,
          organizationName,
          organizationId,
          formData.password,
          loginUrl
        );
        
        if (!emailResult.success) {
          console.warn('Email sending failed:', emailResult.error);
        }
      } catch (emailError) {
        console.warn('Email service error:', emailError);
        // Don't fail the entire operation if email fails
      }

      setEmailSent(true);

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error creating admin:', error);
      setError('Kunne ikke opprette admin-bruker');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginUrl = `${window.location.origin}/login?org=${organizationId}`;

  if (emailSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-md w-full">
          <div className="p-6 text-center">
            <div className="flex justify-end mb-4">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-green-500/10 text-green-400 p-4 rounded-full inline-flex mb-6">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Admin opprettet!</h3>
            <p className="text-gray-300 mb-6">
              {formData.full_name} har blitt opprettet som admin for {organizationName}.
              En velkomst-e-post er sendt til {formData.email}.
            </p>
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-300 mb-2">
                <strong>Innloggingsinformasjon:</strong>
              </p>
              <p className="text-sm">E-post: {formData.email}</p>
              <p className="text-sm">Passord: {formData.password}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-200">
                💡 <strong>Tips:</strong> Kopier passordet før du lukker dette vinduet!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Opprett Admin for {organizationName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="admin@klubb.no"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Medlemsnummer (valgfritt)
              </label>
              <input
                type="text"
                value={formData.member_number}
                onChange={(e) => setFormData(prev => ({ ...prev, member_number: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="12345"
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
              <h4 className="font-medium text-blue-400 mb-2">Velkomst-e-post</h4>
              <p className="text-sm text-blue-200 mb-3">
                En velkomst-e-post vil bli sendt til den nye admin-brukeren med:
              </p>
              <ul className="text-sm text-blue-200 space-y-1 mb-3">
                <li>• Velkommen til Aktivlogg som admin for {organizationName}</li>
                <li>• Innloggingsinformasjon (e-post og passord)</li>
                <li>• Direktelink til deres admin-område</li>
                <li>• Instruksjoner for første gangs pålogging</li>
              </ul>
              <div className="bg-gray-700 rounded p-2">
                <p className="text-xs text-gray-300">
                  <strong>Login URL:</strong> {loginUrl}
                </p>
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
                    Oppretter og sender e-post...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Opprett Admin & Send E-post
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

export function OrganizationDashboard() {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'settings'>('overview');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<OrganizationAdmin | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMembers: 0,
    totalAdmins: 0
  });

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

  useEffect(() => {
    loadOrganizationData();
  }, [orgId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Load organization from Supabase
      const orgResult = await getOrganizationById(orgId || '');
      
      if (orgResult.error || !orgResult.data) {
        // Fallback to default SVPK if not found and orgId matches
        if (orgId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
          const fallbackOrg = {
            id: orgId,
            name: 'Svolvær Pistolklubb',
            slug: 'svpk',
            description: 'Norges beste pistolklubb',
            email: 'post@svpk.no',
            phone: '+47 123 45 678',
            website: 'https://svpk.no',
            address: 'Svolværgata 1, 8300 Svolvær',
            primary_color: '#FFD700',
            secondary_color: '#1F2937',
            logo_url: null,
            active: true,
            created_at: '2024-01-01T00:00:00Z'
          };
          setOrganization(fallbackOrg);
        } else {
          throw new Error('Organisasjon ikke funnet');
        }
      } else {
        setOrganization(orgResult.data);
      }

      // Load members and calculate stats from Supabase
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId || '');

      if (membersError) {
        console.error('Error loading members:', membersError);
        throw new Error('Kunne ikke laste medlemmer');
      }

      const orgMembers = members || [];
      
      setStats({
        totalMembers: orgMembers.length,
        activeMembers: orgMembers.filter((m: any) => m.approved && m.active).length,
        pendingMembers: orgMembers.filter((m: any) => !m.approved).length,
        totalAdmins: orgMembers.filter((m: any) => m.role === 'admin').length
      });

      // Load admins using the new database function
      const adminsResult = await getOrganizationAdmins(orgId || '');
      if (adminsResult.error) {
        console.error('Error loading admins:', adminsResult.error);
        setAdmins([]);
      } else {
        setAdmins(adminsResult.data || []);
      }

    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!window.confirm(`Er du sikker på at du vil fjerne admin-tilgang for ${adminName}?`)) {
      return;
    }

    try {
      const result = await updateMemberRole(adminId, 'member');
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Reload data to reflect changes
      await loadOrganizationData();
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Kunne ikke fjerne admin-tilgang');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-svpk-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/super-admin')}
              className="btn-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
              Tilbake til Super Admin
            </button>
            <div className="flex items-center gap-3">
              {organization?.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className="w-12 h-12 object-contain rounded"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded flex items-center justify-center text-sm font-bold"
                  style={{ 
                    backgroundColor: organization?.primary_color || '#FFD700',
                    color: organization?.secondary_color || '#1F2937'
                  }}
                >
                  {organization?.name?.split(' ').map((word: string) => word[0]).join('').toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-svpk-yellow">{organization?.name}</h1>
                <p className="text-gray-400">Organisasjonsdashboard</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Oversikt
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'admins'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Administratorer ({stats.totalAdmins})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'text-svpk-yellow border-b-2 border-svpk-yellow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Innstillinger
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Totale medlemmer</p>
                    <p className="text-2xl font-bold text-svpk-yellow">{stats.totalMembers}</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Aktive medlemmer</p>
                    <p className="text-2xl font-bold text-green-400">{stats.activeMembers}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Ventende godkjenning</p>
                    <p className="text-2xl font-bold text-orange-400">{stats.pendingMembers}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Administratorer</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.totalAdmins}</p>
                  </div>
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Membership Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                {organization?.id && (
                  <MembershipProgressCard 
                    organizationId={organization.id}
                    onLimitReached={() => {
                      setActiveTab('settings');
                    }}
                  />
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Organisasjonsinformasjon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400">Navn</p>
                  <p className="font-medium">{organization?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">E-post</p>
                  <p className="font-medium">{organization?.email || 'Ikke angitt'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Telefon</p>
                  <p className="font-medium">{organization?.phone || 'Ikke angitt'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Nettside</p>
                  <p className="font-medium">{organization?.website || 'Ikke angitt'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400">Adresse</p>
                  <p className="font-medium">{organization?.address || 'Ikke angitt'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-svpk-yellow">Administratorer</h2>
                <p className="text-gray-400">Administrer admin-brukere for denne organisasjonen</p>
              </div>
              <button
                onClick={() => setShowCreateAdmin(true)}
                className="btn-primary"
              >
                <UserPlus className="w-5 h-5" />
                Opprett Admin
              </button>
            </div>

            <div className="card">
              {admins.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Ingen administratorer funnet</p>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="btn-primary"
                  >
                    <UserPlus className="w-5 h-5" />
                    Opprett første admin
                  </button>
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
                      {admins.map((admin) => (
                        <tr key={admin.id} className="border-b border-gray-700">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-svpk-yellow" />
                              <span className="font-medium">{admin.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{admin.email}</td>
                          <td className="py-3 px-4">
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('nb-NO') : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              admin.active 
                                ? 'bg-green-900/50 text-green-400' 
                                : 'bg-red-900/50 text-red-400'
                            }`}>
                              {admin.active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingAdmin(admin)}
                                className="p-2 text-blue-400 hover:text-blue-300"
                                title="Rediger admin"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin.id || '', admin.full_name || '')}
                                className="p-2 text-red-400 hover:text-red-300"
                                title="Fjern admin-tilgang"
                                disabled={!admin.id}
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
        )}

        {activeTab === 'settings' && (
          <OrganizationSettings />
        )}

        {showCreateAdmin && (
          <CreateAdminModal
            organizationId={orgId!}
            organizationName={organization?.name || 'Organisasjon'}
            onClose={() => setShowCreateAdmin(false)}
            onSuccess={() => {
              setShowCreateAdmin(false);
              loadOrganizationData();
            }}
          />
        )}

        {editingAdmin && (
          <EditAdminModal
            admin={editingAdmin}
            organizationName={organization?.name || 'Organisasjon'}
            onClose={() => setEditingAdmin(null)}
            onSuccess={() => {
              setEditingAdmin(null);
              loadOrganizationData();
            }}
          />
        )}
      </div>
    </div>
  );
}
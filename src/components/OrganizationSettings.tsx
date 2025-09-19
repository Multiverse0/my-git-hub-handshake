import React, { useState, useEffect } from 'react';
import { Save, Palette, Building2, Mail, Globe, FileText, Upload, Loader2, AlertCircle, CheckCircle, X, Plus, Trash2, Copy, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../lib/translations';
import { EmailTestPanel } from './EmailTestPanel';
import { LogoUpload } from './LogoUpload';
import { DEFAULT_ORGANIZATION_COLORS } from '../lib/constants';
import { getAllSubscriptionPlans, getMemberLimitInfo } from '../lib/subscriptionPlans';
import { getOrganizationMemberCount } from '../lib/supabase';

interface OrganizationData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  nsf_enabled: boolean;
  dfs_enabled: boolean;
  dssn_enabled: boolean;
  activity_types: string[];
  subscription_type: string;
}

interface SalesBanner {
  id: string;
  imageUrl: string;
  fileName: string;
  linkUrl?: string;
  uploadDate: string;
  active: boolean;
}

export function OrganizationSettings() {
  const { user, organization, branding } = useAuth();
  const { currentLanguage, setLanguage, isTranslating, t } = useLanguage();
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    primary_color: '#FFD700',
    secondary_color: '#1F2937',
    background_color: '#111827',
    nsf_enabled: true,
    dfs_enabled: false,
    dssn_enabled: false,
    activity_types: ['Trening', 'Stevne', 'Dugnad'],
    subscription_type: 'start'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newActivityType, setNewActivityType] = useState('');
  const [salesBanners, setSalesBanners] = useState<SalesBanner[]>([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [languageSuccess, setLanguageSuccess] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [requestedLanguage, setRequestedLanguage] = useState('');
  const [languageRequestSent, setLanguageRequestSent] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [memberLimitInfo, setMemberLimitInfo] = useState<any>(null);

  // Load organization data on mount
  useEffect(() => {
    const loadOrganizationData = async () => {
      console.log('Auth context data:', { user, organization });
      
      // Try to get organization ID from different sources
      const orgId = user?.organization?.id || organization?.id || user?.organization_id;
      
      if (!orgId) {
        console.log('No organization ID available from any source:', { 
          userOrg: user?.organization, 
          contextOrg: organization,
          userOrgId: user?.organization_id 
        });
        
        // If user has organization data in context, use it to populate the form
        if (organization) {
          console.log('Using organization data from context:', organization);
          setOrgData({
            name: organization.name || '',
            description: organization.description || '',
            email: organization.email || '',
            phone: organization.phone || '',
            website: organization.website || '',
            address: organization.address || '',
            primary_color: organization.primary_color || '#FFD700',
            secondary_color: organization.secondary_color || '#1F2937',
            background_color: organization.background_color || '#FFFFFF',
            nsf_enabled: organization.nsf_enabled !== false,
            dfs_enabled: organization.dfs_enabled !== false,
            dssn_enabled: organization.dssn_enabled !== false,
            activity_types: organization.activity_types || ['Trening', 'Stevne', 'Dugnad'],
            subscription_type: 'professional'
          });
        }
        return;
      }

      console.log('Loading organization data for ID:', orgId);

      try {
        const { getOrganizationById } = await import('../lib/supabase');
        const result = await getOrganizationById(orgId);
        
        if (result.data) {
          const org = result.data;
          console.log('Loaded organization data:', org);
          setOrgData({
            name: org.name || '',
            description: org.description || '',
            email: org.email || '',
            phone: org.phone || '',
            website: org.website || '',
            address: org.address || '',
            primary_color: org.primary_color || '#FFD700',
            secondary_color: org.secondary_color || '#1F2937',
            background_color: org.background_color || '#FFFFFF',
            nsf_enabled: org.nsf_enabled !== false,
            dfs_enabled: org.dfs_enabled !== false,
            dssn_enabled: org.dssn_enabled !== false,
            activity_types: org.activity_types || ['Trening', 'Stevne', 'Dugnad'],
            subscription_type: org.subscription_type || 'start'
          });
        } else if (result.error) {
          console.error('Failed to load organization:', result.error);
          setError(result.error);
        }
      } catch (error) {
        console.error('Error loading organization data:', error);
        setError('Kunne ikke laste organisasjonsdata');
        // Fallback to localStorage if database fails
        const savedOrg = localStorage.getItem('currentOrganization');
        if (savedOrg) {
          const orgInfo = JSON.parse(savedOrg);
          setOrgData({
            name: orgInfo.name || '',
            description: orgInfo.description || '',
            email: orgInfo.email || '',
            phone: orgInfo.phone || '',
            website: orgInfo.website || '',
            address: orgInfo.address || '',
            primary_color: orgInfo.primary_color || '#FFD700',
            secondary_color: orgInfo.secondary_color || '#1F2937',
            background_color: orgInfo.background_color || '#FFFFFF',
            nsf_enabled: orgInfo.nsf_enabled !== false,
            dfs_enabled: orgInfo.dfs_enabled !== false,
            dssn_enabled: orgInfo.dssn_enabled !== false,
            activity_types: orgInfo.activity_types || ['Trening', 'Stevne', 'Dugnad'],
            subscription_type: orgInfo.subscription_type || 'start'
          });
        }
      }
    };

    const loadSalesBanners = () => {
      try {
        const saved = localStorage.getItem('salesBanners');
        if (saved) {
          setSalesBanners(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading sales banners:', error);
      }
    };

    loadOrganizationData();
    loadSalesBanners();
    
    // Load member count and calculate limits
    const loadMemberData = async () => {
      const orgId = user?.organization?.id || organization?.id || user?.organization_id;
      if (orgId) {
        const count = await getOrganizationMemberCount(orgId);
        setMemberCount(count);
        
        // Get current plan from orgData or default
        const currentPlan = orgData.subscription_type || 'start';
        const limitInfo = getMemberLimitInfo(count, currentPlan);
        setMemberLimitInfo(limitInfo);
      }
    };
    
    loadMemberData();
  }, [user?.organization?.id, organization?.id, user?.organization_id, orgData.subscription_type]);

  const handleSave = async () => {
    const orgId = user?.organization?.id || organization?.id || user?.organization_id;
    
    if (!orgId) {
      console.log('No organization ID available for save:', { 
        userOrg: user?.organization, 
        contextOrg: organization,
        userOrgId: user?.organization_id 
      });
      setError('Organisasjons-ID mangler');
      return;
    }

    console.log('Saving organization settings for ID:', orgId, orgData);

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Save to Supabase database
      const { updateOrganizationSettings } = await import('../lib/supabase');
      const result = await updateOrganizationSettings(orgId, {
        name: orgData.name,
        description: orgData.description,
        email: orgData.email,
        phone: orgData.phone,
        website: orgData.website,
        subscription_type: orgData.subscription_type,
        primary_color: orgData.primary_color,
        secondary_color: orgData.secondary_color,
        background_color: orgData.background_color,
        nsf_enabled: orgData.nsf_enabled,
        dfs_enabled: orgData.dfs_enabled,
        dssn_enabled: orgData.dssn_enabled,
        activity_types: orgData.activity_types
      });

      if (result.error) {
        console.error('Failed to save organization settings:', result.error);
        setError(result.error);
        return;
      }

      console.log('Organization settings saved successfully');

      // Trigger branding update event
      const brandingUpdateEvent = new CustomEvent('brandingUpdated', {
        detail: {
          organization_name: orgData.name,
          primary_color: orgData.primary_color,
          secondary_color: orgData.secondary_color,
          background_color: orgData.background_color,
          logo_url: branding.logo_url,
          nsf_enabled: orgData.nsf_enabled,
          dfs_enabled: orgData.dfs_enabled,
          dssn_enabled: orgData.dssn_enabled,
          activity_types: orgData.activity_types
        }
      });
      window.dispatchEvent(brandingUpdateEvent);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload page to apply theme changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error saving organization settings:', error);
      setError('Kunne ikke lagre innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivityType = () => {
    if (newActivityType.trim() && !orgData.activity_types.includes(newActivityType.trim())) {
      setOrgData(prev => ({
        ...prev,
        activity_types: [...prev.activity_types, newActivityType.trim()]
      }));
      setNewActivityType('');
    }
  };

  const handleRemoveActivityType = (activityType: string) => {
    setOrgData(prev => ({
      ...prev,
      activity_types: prev.activity_types.filter(type => type !== activityType)
    }));
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setLanguageError(null);
      await setLanguage(languageCode);
      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 3000);
    } catch (error) {
      console.error('Error changing language:', error);
      setLanguageError('Kunne ikke endre språk. Prøv igjen.');
    }
  };

  const handleLanguageRequest = () => {
    if (!requestedLanguage.trim()) {
      setLanguageError('Vennligst skriv inn ønsket språk');
      return;
    }

    // In a real app, this would send an email or API request
    console.log('Language request:', requestedLanguage);
    setLanguageRequestSent(true);
    setRequestedLanguage('');
    setTimeout(() => setLanguageRequestSent(false), 5000);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingBanner(true);
      setBannerError(null);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const fileType = file.type;
        const fileName = file.name;
        
        if (!fileType.includes('image')) {
          throw new Error(`${fileName}: Kun bildefiler er tillatt.`);
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${fileName}: Filen er for stor. Maksimal størrelse er 5MB.`);
        }
        
        // Convert to base64 for localStorage
        return new Promise<SalesBanner>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            const newBanner: SalesBanner = {
              id: crypto.randomUUID(),
              imageUrl,
              fileName,
              uploadDate: new Date().toISOString(),
              active: true
            };
            resolve(newBanner);
          };
          reader.onerror = () => {
            reject(new Error(`Kunne ikke lese filen ${fileName}`));
          };
          reader.readAsDataURL(file);
        });
      });
      
      // Wait for all files to be processed
      const uploadedBanners = await Promise.all(uploadPromises);
      
      // Add to existing banners
      const updatedBanners = [...salesBanners, ...uploadedBanners];
      setSalesBanners(updatedBanners);
      
      // Save to localStorage
      localStorage.setItem('salesBanners', JSON.stringify(updatedBanners));
      
      console.log(`✅ ${uploadedBanners.length} banner(e) lastet opp`);
      
    } catch (error) {
      console.error('Error uploading banners:', error);
      setBannerError(error instanceof Error ? error.message : 'Det oppstod en feil ved opplasting av bannere.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleToggleBannerActive = (bannerId: string) => {
    const updatedBanners = salesBanners.map(banner =>
      banner.id === bannerId ? { ...banner, active: !banner.active } : banner
    );
    setSalesBanners(updatedBanners);
    localStorage.setItem('salesBanners', JSON.stringify(updatedBanners));
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (!window.confirm('Er du sikker på at du vil slette dette banneret?')) {
      return;
    }

    const updatedBanners = salesBanners.filter(banner => banner.id !== bannerId);
    setSalesBanners(updatedBanners);
    localStorage.setItem('salesBanners', JSON.stringify(updatedBanners));
  };

  const handleUpdateBannerLink = (bannerId: string, linkUrl: string) => {
    const updatedBanners = salesBanners.map(banner =>
      banner.id === bannerId ? { ...banner, linkUrl } : banner
    );
    setSalesBanners(updatedBanners);
    localStorage.setItem('salesBanners', JSON.stringify(updatedBanners));
  };

  const handleCopyOrganizationId = async () => {
    const orgId = user?.organization?.id || organization?.id || user?.organization_id;
    if (!orgId) return;
    
    try {
      await navigator.clipboard.writeText(orgId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy organization ID:', error);
    }
  };

  const resetPrimaryColor = () => {
    setOrgData(prev => ({ ...prev, primary_color: DEFAULT_ORGANIZATION_COLORS.primary_color }));
  };

  const resetSecondaryColor = () => {
    setOrgData(prev => ({ ...prev, secondary_color: DEFAULT_ORGANIZATION_COLORS.secondary_color }));
  };

  const resetBackgroundColor = () => {
    setOrgData(prev => ({ ...prev, background_color: DEFAULT_ORGANIZATION_COLORS.background_color }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold theme-primary-text mb-2">Organisasjonsinnstillinger</h2>
        <p className="text-gray-400">Konfigurer organisasjonsinformasjon og innstillinger</p>
      </div>

      {/* Basic Organization Info */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5" />
          Grunnleggende informasjon
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organisasjonsnavn *
            </label>
            <input
              type="text"
              value={orgData.name}
              onChange={(e) => setOrgData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
              placeholder="Klubbnavn"
            />
          </div>

            <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organisasjons-ID
            </label>
            <div className="relative">
              {(() => {
                const orgId = user?.organization?.id || organization?.id || user?.organization_id;
                return (
                  <input
                    type="text"
                    value={orgId || ''}
                    readOnly
                    className="w-full bg-gray-700 rounded-md px-3 py-2 pr-12 text-gray-400 cursor-not-allowed"
                    placeholder={orgId ? orgId : "Ingen organisasjon valgt"}
                  />
                );
              })()}
              {(() => {
                const orgId = user?.organization?.id || organization?.id || user?.organization_id;
                return orgId && (
                  <button
                    type="button"
                    onClick={handleCopyOrganizationId}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                    title="Kopier organisasjons-ID"
                  >
                    {copySuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                );
              })()}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Unik identifikator for denne organisasjonen
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Abonnementsplan
            </label>
            <select
              value={orgData.subscription_type}
              onChange={(e) => {
                const newPlan = e.target.value;
                setOrgData(prev => ({ ...prev, subscription_type: newPlan }));
                const limitInfo = getMemberLimitInfo(memberCount, newPlan);
                setMemberLimitInfo(limitInfo);
              }}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
            >
              {getAllSubscriptionPlans().map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.memberLimit === -1 ? 'Ubegrenset' : `${plan.memberLimit} medlemmer`})
                  {plan.price && ` - ${plan.price}`}
                </option>
              ))}
            </select>
            
            {/* Current Usage Display */}
            {memberLimitInfo && (
              <div className="mt-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Medlemsbruk</span>
                  <span className="text-xs text-gray-300">
                    {memberLimitInfo.currentCount} / {memberLimitInfo.isUnlimited ? '∞' : memberLimitInfo.limit}
                  </span>
                </div>
                {!memberLimitInfo.isUnlimited && (
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        memberLimitInfo.isAtLimit ? 'bg-red-500' :
                        memberLimitInfo.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, memberLimitInfo.usagePercentage)}%` }}
                    />
                  </div>
                )}
                {memberLimitInfo.isAtLimit && (
                  <p className="text-xs text-red-400 mt-1">
                    Medlemsgrensen er nådd. Oppgrader for å legge til flere medlemmer.
                  </p>
                )}
                {memberLimitInfo.isNearLimit && !memberLimitInfo.isAtLimit && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Nærmer seg medlemsgrensen ({memberLimitInfo.remaining} igjen).
                  </p>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-1">
              Velg abonnementsplan som passer for organisasjonen
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beskrivelse
            </label>
            <textarea
              value={orgData.description}
              onChange={(e) => setOrgData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2 h-24"
              placeholder="Kort beskrivelse av organisasjonen"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5" />
          Kontaktinformasjon
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-post
            </label>
            <input
              type="email"
              value={orgData.email}
              onChange={(e) => setOrgData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
              placeholder="post@klubb.no"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={orgData.phone}
              onChange={(e) => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
              placeholder="+47 123 45 678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nettside
            </label>
            <input
              type="url"
              value={orgData.website}
              onChange={(e) => setOrgData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
              placeholder="https://klubb.no"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={orgData.address}
              onChange={(e) => setOrgData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-gray-700 rounded-md px-3 py-2"
              placeholder="Gateadresse, postnummer sted"
            />
          </div>
        </div>
      </div>

      {/* Visual Branding */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5" />
          Visuell profil
        </h3>

        <div className="space-y-6">
          {/* Logo Upload - Enhanced with LogoUpload component */}
          <LogoUpload onLogoUpdated={(logoUrl) => {
            setOrgData(prev => ({ ...prev, logo_url: logoUrl }));
          }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primærfarge
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={orgData.primary_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-12 h-10 bg-gray-700 rounded-md border border-gray-600"
                />
                <input
                  type="text"
                  value={orgData.primary_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 bg-gray-700 rounded-md px-3 py-2 font-mono text-sm"
                  placeholder="#FFD700"
                />
                <button
                  type="button"
                  onClick={resetPrimaryColor}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Tilbakestill til Svolvær Pistolklubb standard"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sekundærfarge
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={orgData.secondary_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-12 h-10 bg-gray-700 rounded-md border border-gray-600"
                />
                <input
                  type="text"
                  value={orgData.secondary_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1 bg-gray-700 rounded-md px-3 py-2 font-mono text-sm"
                  placeholder="#1F2937"
                />
                <button
                  type="button"
                  onClick={resetSecondaryColor}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Tilbakestill til Svolvær Pistolklubb standard"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bakgrunnsfarge (mørkt tema)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={orgData.background_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, background_color: e.target.value }))}
                  className="w-12 h-10 bg-gray-700 rounded-md border border-gray-600"
                />
                <input
                  type="text"
                  value={orgData.background_color}
                  onChange={(e) => setOrgData(prev => ({ ...prev, background_color: e.target.value }))}
                  className="flex-1 bg-gray-700 rounded-md px-3 py-2 font-mono text-sm"
                  placeholder="#111827"
                />
                <button
                  type="button"
                  onClick={resetBackgroundColor}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Tilbakestill til Svolvær Pistolklubb standard"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium mb-3">Forhåndsvisning av farger</h4>
            <div className="flex items-center gap-4">
              <div 
                className="px-4 py-2 rounded font-semibold"
                style={{ 
                  backgroundColor: orgData.primary_color, 
                  color: orgData.secondary_color 
                }}
              >
                Primærfarge
              </div>
              <div 
                className="px-4 py-2 rounded border-2"
                style={{ 
                  borderColor: orgData.primary_color,
                  color: orgData.primary_color,
                  backgroundColor: orgData.background_color
                }}
              >
                Bakgrunn med primær
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discipline Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5" />
          Skyttergrener og aktiviteter
        </h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Aktive skyttergrener</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={orgData.nsf_enabled}
                  onChange={(e) => setOrgData(prev => ({ ...prev, nsf_enabled: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <div>
                  <span className="font-medium">NSF - Norges Skytterforbund</span>
                  <p className="text-sm text-gray-400">Tradisjonell sportsskyting, pistol og rifle</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={orgData.dfs_enabled}
                  onChange={(e) => setOrgData(prev => ({ ...prev, dfs_enabled: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <div>
                  <span className="font-medium">DFS - Dynamisk Feltskytting</span>
                  <p className="text-sm text-gray-400">Feltskytting og jaktrelaterte aktiviteter</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={orgData.dssn_enabled}
                  onChange={(e) => setOrgData(prev => ({ ...prev, dssn_enabled: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <div>
                  <span className="font-medium">DSSN - Dynamisk Sportsskyting Norge</span>
                  <p className="text-sm text-gray-400">Dynamisk skyting og konkurranser</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Aktivitetstyper</h4>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {orgData.activity_types.map((activityType) => (
                  <div key={activityType} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                    <span>{activityType}</span>
                    <button
                      onClick={() => handleRemoveActivityType(activityType)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivityType}
                  onChange={(e) => setNewActivityType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddActivityType()}
                  className="flex-1 bg-gray-700 rounded-md px-3 py-2"
                  placeholder="Ny aktivitetstype..."
                />
                <button
                  onClick={handleAddActivityType}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Legg til
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Banners Management */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5" />
          Salgs-bannere på forsiden
        </h3>

        <div className="space-y-6">
          <div>
            <label className="btn-secondary cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBannerUpload}
                className="hidden"
              />
              {uploadingBanner ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Laster opp...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Last opp banner-bilder</span>
                </>
              )}
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Bildefiler, maks 5MB per fil. Anbefalt størrelse: 1200x200 piksler
            </p>
          </div>

          {bannerError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {bannerError}
            </div>
          )}

          {salesBanners.length > 0 ? (
            <div className="space-y-4">
              {salesBanners.map((banner) => (
                <div key={banner.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={banner.imageUrl}
                      alt={banner.fileName}
                      className="w-32 h-16 object-cover rounded"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium">{banner.fileName}</p>
                        <p className="text-sm text-gray-400">
                          Lastet opp: {new Date(banner.uploadDate).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Link URL (valgfritt)
                        </label>
                        <input
                          type="url"
                          value={banner.linkUrl || ''}
                          onChange={(e) => handleUpdateBannerLink(banner.id, e.target.value)}
                          className="w-full bg-gray-600 rounded-md px-3 py-2 text-sm"
                          placeholder="https://example.com"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Hvis satt, blir banneret klikkbart og åpner denne linken
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleBannerActive(banner.id)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          banner.active 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {banner.active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen salgs-bannere lastet opp</p>
              <p className="text-sm">Last opp bilder som vil vises på forsiden for medlemmene</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Configuration - Only for Super Users */}
      {user?.user_type === 'super_user' && (
        <EmailTestPanel />
      )}

      {/* Language Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5" />
          Språkinnstillinger
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nåværende språk
            </label>
            <div className="flex items-center gap-4">
              <select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-700 rounded-md px-3 py-2"
                disabled={isTranslating}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              {isTranslating && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Oversetter...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Endringer trer i kraft umiddelbart for alle brukere
            </p>
          </div>

          {languageSuccess && (
            <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">Språkinnstillinger lagret! Siden oppdateres...</p>
            </div>
          )}

          {languageError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{languageError}</p>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-3">Savner du et språk?</h4>
            <p className="text-sm text-blue-200 mb-4">
              Skriv inn ønsket språk og send forespørsel til oss:
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={requestedLanguage}
                onChange={(e) => setRequestedLanguage(e.target.value)}
                placeholder="F.eks. Nederlandsk, Russisk, Arabisk..."
                className="flex-1 bg-gray-700 rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={handleLanguageRequest}
                className="btn-primary"
                disabled={!requestedLanguage.trim()}
              >
                Send forespørsel
              </button>
            </div>
            
            {languageRequestSent && (
              <div className="mt-3 p-2 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm">
                ✅ Språkforespørsel sendt!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.loading')}...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t('admin.save_settings')}
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
          <CheckCircle className="w-5 h-5" />
          <p>{t('admin.settings_saved')}</p>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
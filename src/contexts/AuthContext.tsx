import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  authenticateUser, 
  registerOrganizationMember, 
  getOrganizationBySlug,
  setUserContext,
  getOrganizationBranding,
  checkSuperUsersExist
} from '../lib/supabase';
import type { AuthUser, Organization, OrganizationBranding } from '../lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  organization: Organization | null;
  branding: OrganizationBranding;
  loading: boolean;
  needsSetup: boolean;
  login: (email: string, password: string, rememberMe: boolean, organizationSlug?: string) => Promise<void>;
  register: (organizationSlug: string, email: string, password: string, fullName: string, memberNumber?: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (organizationSlug: string) => Promise<void>;
  setOrganizationContext: (organizationSlug: string) => Promise<void>;
  checkSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branding, setBranding] = useState<OrganizationBranding>({
    organization_name: 'Idrettsklubb',
    primary_color: '#FFD700',
    secondary_color: '#1F2937'
  });
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Listen for branding updates from OrganizationSettings
  useEffect(() => {
    const handleBrandingUpdate = (event: CustomEvent) => {
      setBranding(event.detail);
    };

    window.addEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('brandingUpdated', handleBrandingUpdate as EventListener);
    };
  }, []);

  const checkSetupStatus = async () => {
    try {
      const superUsersExist = await checkSuperUsersExist();
      setNeedsSetup(false); // Always skip setup now
    } catch (error) {
      console.error('Error checking setup status:', error);
      setNeedsSetup(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await checkSetupStatus();
      
      try {
        const savedAuth = localStorage.getItem('currentAuth');
        const savedOrg = localStorage.getItem('currentOrganization');
        
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          setUser(authData);
          setIsAuthenticated(true);
          
          // Set user context for RLS
          try {
            await setUserContext(authData.email);
          } catch (error) {
            console.warn('Failed to set user context during initialization:', error);
          }
          
          // Load organization if user is organization member
          if (authData.user_type === 'organization_member' && savedOrg) {
            const orgData = JSON.parse(savedOrg);
            setOrganization(orgData);
            
            // Load branding
            const brandingData = await getOrganizationBranding(orgData.id);
            // Override with localStorage data if available
            brandingData.logo_url = orgData.logo_url || brandingData.logo_url;
            if (orgData.primary_color) brandingData.primary_color = orgData.primary_color;
            if (orgData.secondary_color) brandingData.secondary_color = orgData.secondary_color;
            setBranding(brandingData);
          } else if (authData.user_type === 'super_user' && savedOrg) {
            // For super users, load organization from localStorage
            const orgData = JSON.parse(savedOrg);
            setOrganization(orgData);
            
            // Load branding from localStorage
            const brandingData = {
              organization_name: orgData.name || 'Idrettsklubb',
              primary_color: orgData.primary_color || '#FFD700',
              secondary_color: orgData.secondary_color || '#1F2937',
              logo_url: orgData.logo_url || undefined
            };
            setBranding(brandingData);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('currentAuth');
        localStorage.removeItem('currentOrganization');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean, organizationSlug?: string) => {
    try {
      setLoading(true);
      
      const result = await authenticateUser(email, password, organizationSlug);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        
        // Set user context for RLS
        await setUserContext(email);
        
        // Store auth data
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('currentAuth', JSON.stringify(result.data.user));
        
        // Handle organization context
        if (result.data.organization) {
          setOrganization(result.data.organization);
          localStorage.setItem('currentOrganization', JSON.stringify(result.data.organization));
          
          // Load branding
          const brandingData = await getOrganizationBranding(result.data.organization.id);
          setBranding(brandingData);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const register = async (organizationSlug: string, email: string, password: string, fullName: string, memberNumber?: string) => {
    try {
      setLoading(true);
      
      const result = await registerOrganizationMember(organizationSlug, email, password, fullName, memberNumber);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Registration successful - user needs admin approval
      // Don't auto-login, show success message instead
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (organizationSlug: string) => {
    try {
      if (!user || user.user_type !== 'super_user') {
        throw new Error('Kun super-brukere kan bytte organisasjon');
      }

      // Load organization from localStorage
      const savedOrgs = localStorage.getItem('organizations');
      if (savedOrgs) {
        const organizations = JSON.parse(savedOrgs);
        const targetOrg = organizations.find((org: any) => org.slug === organizationSlug);
        
        if (targetOrg) {
          setOrganization(targetOrg);
          localStorage.setItem('currentOrganization', JSON.stringify(targetOrg));
          
          // Load branding
          const brandingData = {
            organization_name: targetOrg.name || 'Idrettsklubb',
            primary_color: targetOrg.primary_color || '#FFD700',
            secondary_color: targetOrg.secondary_color || '#1F2937',
            logo_url: targetOrg.logo_url || undefined
          };
          setBranding(brandingData);
          return;
        }
      }

      throw new Error('Organisasjon ikke funnet');

    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  };

  const setOrganizationContext = async (organizationSlug: string) => {
    try {
      const result = await getOrganizationBySlug(organizationSlug);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Organisasjon ikke funnet');
      }

      setOrganization(result.data);
      localStorage.setItem('currentOrganization', JSON.stringify(result.data));
      
      // Load branding
      const brandingData = await getOrganizationBranding(result.data.id);
      setBranding(brandingData);

    } catch (error) {
      console.error('Error setting organization context:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setIsAuthenticated(false);
    setBranding({
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937'
    });
    
    localStorage.removeItem('currentAuth');
    localStorage.removeItem('currentOrganization');
    sessionStorage.removeItem('currentAuth');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      organization,
      branding,
      loading,
      needsSetup,
      login, 
      register, 
      logout,
      switchOrganization,
      setOrganizationContext,
      checkSetupStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Add computed properties for easier access
  const { user } = context;
  const profile = user?.member_profile || user?.super_user_profile;
  
  return {
    ...context,
    profile
  };
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  authenticateUser, 
  registerOrganizationMember, 
  getOrganizationBySlug,
  setUserContext,
  getOrganizationBranding,
  checkSuperUsersExist,
  getCurrentUser,
  signOut,
  supabase
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
      setNeedsSetup(!superUsersExist);
    } catch (error) {
      console.error('Error checking setup status:', error);
      setNeedsSetup(true);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await checkSetupStatus();
      
      try {
        // Check if user is already authenticated with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            
            // Set user context for RLS
            await setUserContext(currentUser.email);
            
            // Load organization if user is organization member
            if (currentUser.user_type === 'organization_member' && currentUser.organization) {
              setOrganization(currentUser.organization);
              
              // Load branding
              const brandingData = await getOrganizationBranding(currentUser.organization.id);
              setBranding(brandingData);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          await setUserContext(currentUser.email);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrganization(null);
        setIsAuthenticated(false);
        setBranding({
          organization_name: 'Idrettsklubb',
          primary_color: '#FFD700',
          secondary_color: '#1F2937'
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean, organizationSlug?: string) => {
    try {
      setLoading(true);
      
      const result = await authenticateUser(email, password);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        const user = result.data.user;
        setUser(user);
        setIsAuthenticated(true);
        
        // Set user context for RLS
        await setUserContext(user.email);
        
        // Handle organization context
        if (user.organization) {
          setOrganization(user.organization);
          
          // Load branding
          const brandingData = await getOrganizationBranding(user.organization.id);
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

      // Get organization from database
      const result = await getOrganizationBySlug(organizationSlug);
      if (result.error || !result.data) {
        throw new Error(result.error || 'Organisasjon ikke funnet');
      }

      setOrganization(result.data);
      
      // Load branding
      const brandingData = await getOrganizationBranding(result.data.id);
      setBranding(brandingData);

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
      
      // Load branding
      const brandingData = await getOrganizationBranding(result.data.id);
      setBranding(brandingData);

    } catch (error) {
      console.error('Error setting organization context:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setOrganization(null);
    setIsAuthenticated(false);
    setBranding({
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937'
    });
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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  authenticateUser, 
  registerOrganizationMember, 
  getOrganizationBySlug,
  setUserContext,
  getOrganizationBranding,
  checkSuperUsersExist,
  getCurrentUser,
  signOut
} from '../lib/supabase';
import { supabase } from '../integrations/supabase/client';
import type { AuthUser, Organization, OrganizationBranding } from '../lib/types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  organization: Organization | null;
  branding: OrganizationBranding;
  loading: boolean;
  needsSetup: boolean;
  initError: string | null;
  login: (email: string, password: string, rememberMe: boolean, organizationSlug?: string) => Promise<void>;
  register: (organizationSlug: string, email: string, password: string, fullName: string, memberNumber?: string, organizationCode?: string) => Promise<void>;
  logout: () => void;
  switchOrganization: (organizationSlug: string) => Promise<void>;
  setOrganizationContext: (organizationSlug: string) => Promise<void>;
  checkSetupStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
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
  const [initError, setInitError] = useState<string | null>(null);

  console.log('[AuthProvider] Render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', !!user, 'error:', initError);

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

  // Initialize auth state with timeout and better error handling
  useEffect(() => {
    const initializeAuth = async () => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth initialization timeout')), 15000)
      );

      try {
        console.log('[AuthProvider] Starting initialization...');
        setInitError(null);
        
        // Test basic connectivity first
        const { error: connectError } = await supabase.from('organizations').select('count').limit(1);
        if (connectError) {
          console.error('[AuthProvider] Database connectivity issue:', connectError);
          setInitError(`Database connection failed: ${connectError.message}`);
          setLoading(false);
          return;
        }

        // Run setup check with timeout
        await Promise.race([checkSetupStatus(), timeout]);
        
        // Check if user is already authenticated with Supabase
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeout
        ]) as any;
        
        // Handle invalid refresh token errors
        if (sessionError && sessionError.message?.includes('refresh_token_not_found')) {
          console.warn('Invalid refresh token detected, clearing auth state');
          await supabase.auth.signOut();
          setUser(null);
          setOrganization(null);
          setIsAuthenticated(false);
          setBranding({
            organization_name: 'Idrettsklubb',
            primary_color: '#FFD700',
            secondary_color: '#1F2937'
          });
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          try {
            // Add timeout for getCurrentUser to prevent hanging
            const getUserPromise = getCurrentUser();
            const currentUser = await Promise.race([getUserPromise, timeout]) as any;
            
            if (currentUser) {
              setUser(currentUser);
              setIsAuthenticated(true);
              
              // Set user context for RLS (with timeout)
              const setContextPromise = setUserContext(currentUser.email);
              await Promise.race([setContextPromise, timeout]);
              
              // Load organization if user is organization member (with timeout)
              if (currentUser.user_type === 'organization_member' && currentUser.organization) {
                setOrganization(currentUser.organization);
                
                try {
                  // Load branding with timeout
                  const brandingPromise = getOrganizationBranding(currentUser.organization.id);
                  const brandingData = await Promise.race([brandingPromise, timeout]) as any;
                  setBranding(brandingData);
                } catch (brandingError) {
                  console.warn('Could not load branding, using defaults:', brandingError);
                  // Keep default branding if branding load fails
                }
              }
            } else {
              console.log('No current user data available');
              setUser(null);
              setOrganization(null);
              setIsAuthenticated(false);
            }
          } catch (userError) {
            console.warn('Error loading user data:', userError);
            // If user data loading fails, still try to use the session
            setUser(null);
            setOrganization(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No active session found');
          setUser(null);
          setOrganization(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setInitError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Clear potentially corrupted auth state
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn('Error signing out during cleanup:', signOutError);
        }
        setUser(null);
        setOrganization(null);
        setIsAuthenticated(false);
        setBranding({
          organization_name: 'Idrettsklubb',
          primary_color: '#FFD700',
          secondary_color: '#1F2937'
        });
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth state changes with timeout protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      // Use setTimeout to prevent blocking the auth state change callback
      setTimeout(async () => {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth state change timeout')), 8000)
        );

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            try {
              console.log('👤 Processing user session for event:', event);
              
              // Get current user with timeout
              const getUserPromise = getCurrentUser();
              const currentUser = await Promise.race([getUserPromise, timeout]) as any;
              
              if (currentUser) {
                console.log('✅ User data loaded:', currentUser.user_type, currentUser.email);
                setUser(currentUser);
                setIsAuthenticated(true);
                
                // Set user context with timeout
                try {
                  const setContextPromise = setUserContext(currentUser.email);
                  await Promise.race([setContextPromise, timeout]);
                } catch (contextError) {
                  console.warn('Could not set user context:', contextError);
                }
                
                // Load organization data with timeout
                if (currentUser.user_type === 'organization_member' && currentUser.organization) {
                  setOrganization(currentUser.organization);
                  
                  try {
                    const brandingPromise = getOrganizationBranding(currentUser.organization.id);
                    const brandingData = await Promise.race([brandingPromise, timeout]) as any;
                    setBranding(brandingData);
                  } catch (brandingError) {
                    console.warn('Could not load branding:', brandingError);
                    // Keep existing branding
                  }
                } else {
                  console.log('🏢 No organization data for user type:', currentUser.user_type);
                }
              } else {
                console.log('❌ Could not get current user data');
                setUser(null);
                setOrganization(null);
                setIsAuthenticated(false);
              }
            } catch (error) {
              console.error('Error handling auth state change:', error);
              // Clear auth state on error to prevent infinite loops
              setUser(null);
              setOrganization(null);
              setIsAuthenticated(false);
              setBranding({
                organization_name: 'Idrettsklubb',
                primary_color: '#FFD700',
                secondary_color: '#1F2937'
              });
            }
          } else {
            console.log('⚠️ No user in session for event:', event);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setOrganization(null);
          setIsAuthenticated(false);
          setBranding({
            organization_name: 'Idrettsklubb',
            primary_color: '#FFD700',
            secondary_color: '#1F2937'
          });
        }
        
        // Always clear loading after handling auth state change
        setLoading(false);
      }, 0);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
      

  const login = async (email: string, password: string, _rememberMe: boolean, organizationSlug?: string) => {
    try {
      setLoading(true);
      
      // If organizationSlug is provided, set organization context first
      if (organizationSlug) {
        try {
          await setOrganizationContext(organizationSlug);
        } catch (orgError) {
          console.warn('Could not set organization context:', orgError);
        }
      }
      
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
        } else if (organizationSlug && user.user_type === 'super_user') {
          // Super users can access any organization
            const orgResult = await getOrganizationBySlug(organizationSlug);
            if (orgResult.data) {
              setOrganization(orgResult.data);
            }
        }
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    organizationSlug: string,
    email: string,
    password: string,
    fullName: string,
    memberNumber?: string,
    organizationCode?: string
  ) => {
    try {
      setLoading(true);
      
      // Use the existing registerOrganizationMember function from supabase.ts
      const result = await registerOrganizationMember(
        organizationSlug,
        email,
        password,
        fullName,
        memberNumber,
        organizationCode,
        'member' // Always register as member, role can be changed by admin later
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('✅ Registration successful');
      // Don't return the result, just complete successfully

    } catch (error) {
      console.error('❌ Registration error:', error);
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

  const refreshUserData = async () => {
    try {
      if (!user?.id) return;
      
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Update organization data if needed
        if (currentUser.user_type === 'organization_member' && currentUser.organization) {
          setOrganization(currentUser.organization);
          
          try {
            const brandingData = await getOrganizationBranding(currentUser.organization.id);
            setBranding(brandingData);
          } catch (brandingError) {
            console.warn('Could not refresh branding:', brandingError);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
      initError,
      login, 
      register, 
      logout,
      switchOrganization,
      setOrganizationContext,
      checkSetupStatus,
      refreshUserData
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
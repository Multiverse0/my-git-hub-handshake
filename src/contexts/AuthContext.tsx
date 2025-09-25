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

  // Set up real-time role change subscription
  useEffect(() => {
    let roleSubscription: any = null;

    const setupRoleSubscription = () => {
      if (!user?.email) return;

      // Subscribe to changes in organization_members table for current user
      roleSubscription = supabase
        .channel('user-role-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'organization_members',
            filter: `email=eq.${user.email}`
          },
          (payload) => {
            console.log('🔄 Role change detected for user:', payload);
            // Refresh user data when role changes
            refreshUserData();
          }
        )
        .subscribe();
    };

    if (user?.email && isAuthenticated) {
      setupRoleSubscription();
    }

    return () => {
      if (roleSubscription) {
        roleSubscription.unsubscribe();
      }
    };
  }, [user?.email, isAuthenticated]);

  // Initialize auth state with exponential backoff and performance monitoring
  useEffect(() => {
    const initializeAuth = async () => {
      const startTime = Date.now();
      const maxRetries = 3;
      
      const retry = async (operation: () => Promise<any>, name: string): Promise<any> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const opStart = Date.now();
            const result = await Promise.race([
              operation(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`${name} timeout after ${20000 + (attempt * 10000)}ms`)), 20000 + (attempt * 10000))
              )
            ]);
            console.log(`[AuthProvider] ${name} completed in ${Date.now() - opStart}ms (attempt ${attempt + 1})`);
            return result;
          } catch (error) {
            console.warn(`[AuthProvider] ${name} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
            if (attempt === maxRetries) throw error;
            
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      try {
        console.log('[AuthProvider] Starting initialization...');
        setInitError(null);
        
        // Test basic connectivity with retry
        await retry(async () => {
          const { error } = await supabase.from('organizations').select('count').limit(1);
          if (error) throw error;
        }, 'Database connectivity test');

        // Run setup check with retry
        await retry(() => checkSetupStatus(), 'Setup status check');
        
        // Check if user is already authenticated with retry
        const { data: { session }, error: sessionError } = await retry(
          () => supabase.auth.getSession(),
          'Session check'
        ) as any;
        
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
            // Get user data with retry and performance monitoring
            const currentUser = await retry(() => getCurrentUser(), 'User data loading');
            
            if (currentUser) {
              setUser(currentUser);
              setIsAuthenticated(true);
              
              // Load organization data if user is organization member
              if (currentUser.user_type === 'organization_member' && currentUser.organization) {
                setOrganization(currentUser.organization);
                
                try {
                  // Load branding with retry
                  const brandingData = await retry(
                    () => getOrganizationBranding(currentUser.organization.id),
                    'Branding data loading'
                  );
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
            console.warn('Error loading user data after retries:', userError);
            setUser(null);
            setOrganization(null);
            setIsAuthenticated(false);
            setInitError(`Failed to load user data: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
          }
        } else {
          console.log('No active session found');
          setUser(null);
          setOrganization(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[AuthProvider] Initialization failed after ${totalTime}ms:`, error);
        
        // Provide more specific error messages
        let errorMessage = 'Initialization failed';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = `Connection timeout (${totalTime}ms). Please check your internet connection and try refreshing the page.`;
          } else if (error.message.includes('connectivity')) {
            errorMessage = 'Unable to connect to the database. Please try again later.';
          } else {
            errorMessage = `Authentication error: ${error.message}`;
          }
        }
        
        setInitError(errorMessage);
        
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
        const totalTime = Date.now() - startTime;
        console.log(`[AuthProvider] Initialization completed in ${totalTime}ms`);
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth state changes with optimized handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      
      // Process auth state changes without blocking
      setTimeout(async () => {
        const startTime = Date.now();
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            try {
              console.log('👤 Processing user session for event:', event);
              
              // Get current user with shorter timeout for auth state changes
              const timeoutMs = 10000; // 10 seconds
              const currentUser = await Promise.race([
                getCurrentUser(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Auth state change timeout')), timeoutMs)
                )
              ]) as any;
              
              if (currentUser) {
                console.log(`✅ User data loaded in ${Date.now() - startTime}ms:`, currentUser.user_type, currentUser.email);
                setUser(currentUser);
                setIsAuthenticated(true);
                
                // Load organization data if needed
                if (currentUser.user_type === 'organization_member' && currentUser.organization) {
                  setOrganization(currentUser.organization);
                  
                  // Load branding in background - don't block on this
                  getOrganizationBranding(currentUser.organization.id)
                    .then(setBranding)
                    .catch(error => {
                      console.warn('Could not load branding in background:', error);
                      // Keep existing branding
                    });
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
              console.error(`Error handling auth state change after ${Date.now() - startTime}ms:`, error);
              
              // Don't clear auth state immediately on timeout - give user another chance
              if (error instanceof Error && error.message.includes('timeout')) {
                console.warn('Auth state change timed out, keeping existing state for now');
                return;
              }
              
              // Clear auth state on other errors
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
        
        console.log(`[AuthProvider] Auth state change processed in ${Date.now() - startTime}ms`);
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
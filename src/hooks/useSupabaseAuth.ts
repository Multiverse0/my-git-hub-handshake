import { useEffect, useState } from 'react';
import { supabase, getCurrentUser, setUserContext } from '../lib/supabase';
import type { AuthUser } from '../lib/types';

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            await setUserContext(currentUser.email);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            await setUserContext(currentUser.email);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated
  };
}
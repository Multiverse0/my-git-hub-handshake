import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  onUpdate?: (payload: any) => void
) {
  const [,] = useState<T[]>([]);
  const [,] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    let subscription: RealtimeChannel;

    const setupRealtime = async () => {
      try {
        // Create realtime subscription
        subscription = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter
            },
            (payload) => {
              console.log(`Realtime update for ${table}:`, payload);
              if (onUpdate) {
                onUpdate(payload);
              }
            }
          )
          .subscribe();

        setChannel(subscription);
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };

    setupRealtime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [table, filter]);

  return {
    channel
  };
}

export function useTrainingSessionsRealtime(organizationId: string) {
  return useRealtimeSubscription(
    'member_training_sessions',
    `organization_id=eq.${organizationId}`,
    (payload) => {
      console.log('Training session updated:', payload);
      // Handle realtime updates for training sessions
    }
  );
}

export function useOrganizationMembersRealtime(organizationId: string) {
  return useRealtimeSubscription(
    'organization_members',
    `organization_id=eq.${organizationId}`,
    (payload) => {
      console.log('Organization member updated:', payload);
      // Handle realtime updates for members
    }
  );
}
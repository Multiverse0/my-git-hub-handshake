import { supabase } from './supabase';
import type { 
  Organization, 
  OrganizationMember, 
  MemberTrainingSession,
  TrainingLocation,
  SuperUser
} from './types';

// Database query helpers with proper error handling and type safety

export class DatabaseService {
  // Organizations
  static async getOrganizations(): Promise<Organization[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  static async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  // Members
  static async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }
  }

  static async getMemberById(memberId: string): Promise<OrganizationMember | null> {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching member:', error);
      return null;
    }
  }

  // Training Sessions
  static async getTrainingSessions(organizationId: string): Promise<MemberTrainingSession[]> {
    try {
      const { data, error } = await supabase
        .from('member_training_sessions')
        .select(`
          *,
          organization_members (*),
          training_locations (*),
          training_session_details (*),
          session_target_images (*)
        `)
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      return [];
    }
  }

  static async getMemberTrainingSessions(memberId: string): Promise<MemberTrainingSession[]> {
    try {
      const { data, error } = await supabase
        .from('member_training_sessions')
        .select(`
          *,
          organization_members (*),
          training_locations (*),
          training_session_details (*),
          session_target_images (*)
        `)
        .eq('member_id', memberId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member training sessions:', error);
      return [];
    }
  }

  // Training Locations
  static async getTrainingLocations(organizationId: string): Promise<TrainingLocation[]> {
    try {
      const { data, error } = await supabase
        .from('training_locations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching training locations:', error);
      return [];
    }
  }

  // Super Users
  static async getSuperUsers(): Promise<SuperUser[]> {
    try {
      const { data, error } = await supabase
        .from('super_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching super users:', error);
      return [];
    }
  }

  // Utility functions
  static async executeRPC(functionName: string, params: any = {}): Promise<any> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error executing RPC ${functionName}:`, error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
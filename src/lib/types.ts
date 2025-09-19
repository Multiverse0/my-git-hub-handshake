// Multi-tenant types for sports club management system

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo_url?: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  registration_code?: string | null;
  created_at: string | null;
  updated_at: string | null;
  active: boolean | null;
  subscription_type?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  admin_notes?: string;
  background_color?: string | null;
  nsf_enabled?: boolean | null;
  dfs_enabled?: boolean | null;
  dssn_enabled?: boolean | null;
  activity_types?: any;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface SuperUser {
  id: string;
  email: string;
  full_name: string;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  member_number?: string | null;
  avatar_url?: string | null;
  startkort_url?: string | null;
  diploma_url?: string | null;
  role: string | null;  // Allow null for database compatibility
  approved: boolean | null;
  active: boolean | null;
  password_hash?: string | null;
  created_at: string | null;
  updated_at: string | null;
  startkort_file_name?: string | null;
  diploma_file_name?: string | null;
  other_files?: any;
  organizations?: Organization;
}

export interface OrganizationAdmin {
  id: string;
  organization_id: string;
  member_id: string;
  permissions: any;
  created_at: string | null;
  updated_at: string | null;
  email?: string;
  full_name?: string;
  active?: boolean | null;
}

export interface TrainingLocation {
  id: string;
  organization_id: string;
  name: string;
  qr_code_id: string;
  description?: string | null;
  active: boolean | null;
  nsf_enabled?: boolean | null;
  dfs_enabled?: boolean | null;
  dssn_enabled?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MemberTrainingSession {
  id: string;
  organization_id: string;
  member_id: string;
  location_id: string;
  start_time: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  verified: boolean | null;
  verified_by?: string | null;
  verification_time?: string | null;
  manual_entry: boolean | null;
  notes?: string | null;
  discipline?: string | null;
  created_at: string | null;
  updated_at: string | null;
  member?: OrganizationMember;
  location?: TrainingLocation;
  organization_members?: OrganizationMember;
  training_locations?: TrainingLocation;
  session_target_images?: SessionTargetImage[];
  details?: {
    training_type?: string;
    results?: string;
    notes?: string;
    target_images?: string[];
  };
}

export interface TrainingSession {
  id: string;
  user_id: string;
  range_location_id: string;
  start_time: string;
  end_time?: string;
  verified: boolean;
  verified_by?: string;
  verification_time?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionTargetImage {
  id: string;
  session_id: string;
  image_url: string;
  filename?: string | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  member_number?: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url?: string | null;
  startkort_url?: string | null;
  diploma_url?: string | null;
  role?: string | null;
  other_files?: any;
  startkort_file_name?: string | null;
  diploma_file_name?: string | null;
}

export interface OrganizationBranding {
  organization_name: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string | null;
  background_color?: string | null;
  nsf_enabled?: boolean | null;
  dfs_enabled?: boolean | null;
  dssn_enabled?: boolean | null;
  activity_types?: any;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  user_type: 'super_user' | 'organization_member';
  organization_id?: string;
  organization?: Organization;
  member_profile?: OrganizationMember;
  super_user_profile?: SuperUser;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
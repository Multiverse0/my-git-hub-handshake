// Multi-tenant types for sports club management system

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  subscription_plan?: 'starter' | 'professional';
  admin_notes?: string;
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export interface SuperUser {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  member_number?: string;
  avatar_url?: string;
  startkort_url?: string;
  diploma_url?: string;
  role: 'member' | 'admin' | 'range_officer';
  approved: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationAdmin {
  id: string;
  organization_id: string;
  member_id: string;
  permissions: {
    manage_members?: boolean;
    manage_training?: boolean;
    manage_settings?: boolean;
  };
  created_at: string;
}

export interface TrainingLocation {
  id: string;
  organization_id: string;
  name: string;
  qr_code_id: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberTrainingSession {
  id: string;
  organization_id: string;
  member_id: string;
  location_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  verified: boolean;
  verified_by?: string;
  verification_time?: string;
  manual_entry: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  member?: OrganizationMember;
  location?: TrainingLocation;
  details?: TrainingSessionDetails;
  target_images?: SessionTargetImage[];
}

export interface TrainingSessionDetails {
  id: string;
  session_id: string;
  training_type?: string;
  results?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionTargetImage {
  id: string;
  session_id: string;
  image_url: string;
  filename?: string;
  created_at: string;
}

// Auth context types
export interface AuthUser {
  id: string;
  email: string;
  user_type: 'super_user' | 'organization_member';
  organization_id?: string;
  organization?: Organization;
  member_profile?: OrganizationMember;
  super_user_profile?: SuperUser;
}

// Legacy types for backward compatibility (will be removed)
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  member_number: string;
  join_date: string;
  avatar_url?: string;
  startkort_url?: string;
  diploma_url?: string;
  role?: 'user' | 'admin' | 'superuser';
  created_at?: string;
  updated_at?: string;
}

export type ProfileFormData = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;

export interface TrainingSession {
  id: string;
  user_id: string;
  range_location_id: string;
  start_time: string;
  end_time?: string;
  verified: boolean;
  verified_by?: string;
  verification_time?: string;
  manual_entry?: boolean;
  range_officer_approval?: boolean;
  range_officer_name?: string;
  details?: TrainingDetails;
  target_images?: TargetImage[];
}

export interface TrainingDetails {
  id: string;
  training_session_id: string;
  training_type: string;
  results: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TargetImage {
  id: string;
  training_session_id: string;
  image_url: string;
  created_at: string;
}

export interface RangeLocation {
  id: string;
  name: string;
  qr_code_id: string;
}

export interface ManualTrainingSession {
  date: string;
  location: string;
  branch: string;
  activity: string;
  notes: string;
}

// Branding and theming
export interface OrganizationBranding {
  primary_color: string;
  secondary_color: string;
  background_color?: string;
  logo_url?: string;
  organization_name: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
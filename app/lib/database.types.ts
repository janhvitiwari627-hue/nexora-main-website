/**
 * Nexora Ecosystem — Phase 3 Canonical Supabase Database TypeScript Definitions
 * 
 * Auto-aligned with the 29 consolidated migrations:
 * Supabase Project: https://qwaehqsmodekbgvnaavz.supabase.co
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlatformRole = 'customer' | 'business_user' | 'growth_partner' | 'admin' | 'staff';
export type OrganizationRole = 'owner' | 'manager' | 'staff' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'pending' | 'partially_paid' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type LocationApprovalStatus = 'pending' | 'approved' | 'rejected';
export type MediaStatus = 'pending' | 'active' | 'inactive' | 'rejected' | 'archived';
export type JobPortalRole = 'job_seeker' | 'employer' | 'admin';
export type JobPostStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published' | 'paused' | 'closed' | 'archived';
export type JobApplicationStatus =
  | 'submitted'
  | 'viewed'
  | 'shortlisted'
  | 'interview_requested'
  | 'interview_confirmed'
  | 'interview_completed'
  | 'offer_sent'
  | 'offer_accepted'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'position_closed';

export type CanonicalThemeId =
  | 'barber_mens_grooming'
  | 'hair_studio_color_bar'
  | 'beauty_skin_spa'
  | 'family_full_service'
  | 'nail_lash_studio';

export type CanonicalThemeSlug =
  | 'barber_mens_grooming'
  | 'hair_studio_color_bar'
  | 'beauty_skin_spa'
  | 'full_service_family_salon'
  | 'nail_lash_studio';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          platform_role: PlatformRole;
          is_active: boolean;
          avatar_url: string | null;
          loyalty_points: number;
          wallet_balance_paise: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          platform_role?: PlatformRole;
          is_active?: boolean;
          avatar_url?: string | null;
          loyalty_points?: number;
          wallet_balance_paise?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          platform_role?: PlatformRole;
          is_active?: boolean;
          avatar_url?: string | null;
          loyalty_points?: number;
          wallet_balance_paise?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          is_active: boolean;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrganizationRole;
          is_active?: boolean;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationRole;
          is_active?: boolean;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      growth_partners: {
        Row: {
          id: string;
          user_id: string;
          referral_code: string;
          commission_rate_bps: number;
          status: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          referral_code: string;
          commission_rate_bps?: number;
          status?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          referral_code?: string;
          commission_rate_bps?: number;
          status?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      growth_partner_commissions: {
        Row: {
          id: string;
          booking_id: string;
          growth_partner_id: string;
          salon_id: string;
          attribution_id: string | null;
          booking_gross_paise: number;
          platform_fee_paise: number;
          commission_paise: number;
          commission_rate_bps: number;
          status: 'held' | 'payable' | 'paid' | 'void' | 'clawed_back';
          hold_days: number;
          accrued_at: string;
          completed_at: string | null;
          hold_until: string;
          released_at: string | null;
          paid_at: string | null;
          payout_reference: string | null;
          voided_at: string | null;
          void_reason: string | null;
          source_event: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          growth_partner_id: string;
          salon_id: string;
          attribution_id?: string | null;
          booking_gross_paise?: number;
          platform_fee_paise?: number;
          commission_paise?: number;
          commission_rate_bps?: number;
          status?: 'held' | 'payable' | 'paid' | 'void' | 'clawed_back';
          hold_days?: number;
          accrued_at?: string;
          completed_at?: string | null;
          hold_until: string;
          released_at?: string | null;
          paid_at?: string | null;
          payout_reference?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          source_event?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          growth_partner_id?: string;
          salon_id?: string;
          attribution_id?: string | null;
          booking_gross_paise?: number;
          platform_fee_paise?: number;
          commission_paise?: number;
          commission_rate_bps?: number;
          status?: 'held' | 'payable' | 'paid' | 'void' | 'clawed_back';
          hold_days?: number;
          accrued_at?: string;
          completed_at?: string | null;
          hold_until?: string;
          released_at?: string | null;
          paid_at?: string | null;
          payout_reference?: string | null;
          voided_at?: string | null;
          void_reason?: string | null;
          source_event?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      salons: {
        Row: {
          id: string;
          organization_id: string | null;
          owner_id: string;
          theme_id: string | null;
          name: string;
          slug: string | null;
          is_active: boolean;
          verified: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          owner_id: string;
          theme_id?: string | null;
          name: string;
          slug?: string | null;
          is_active?: boolean;
          verified?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          owner_id?: string;
          theme_id?: string | null;
          name?: string;
          slug?: string | null;
          is_active?: boolean;
          verified?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      themes: {
        Row: {
          id: string;
          theme_id: CanonicalThemeId;
          slug: CanonicalThemeSlug;
          name: string;
          description: string | null;
          target_audience: string | null;
          ui_config: Json;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          theme_id: CanonicalThemeId;
          slug?: CanonicalThemeSlug;
          name: string;
          description?: string | null;
          target_audience?: string | null;
          ui_config?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme_id?: CanonicalThemeId;
          slug?: CanonicalThemeSlug;
          name?: string;
          description?: string | null;
          target_audience?: string | null;
          ui_config?: Json;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          theme_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          theme_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          theme_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          theme_id: string | null;
          category_id: string | null;
          predefined_service_id: string | null;
          name: string;
          description: string | null;
          price_paise: number;
          duration_minutes: number;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          theme_id?: string | null;
          category_id?: string | null;
          predefined_service_id?: string | null;
          name: string;
          description?: string | null;
          price_paise: number;
          duration_minutes: number;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          theme_id?: string | null;
          category_id?: string | null;
          predefined_service_id?: string | null;
          name?: string;
          description?: string | null;
          price_paise?: number;
          duration_minutes?: number;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          salon_id: string;
          theme_id: string;
          name: string;
          is_active: boolean;
          display_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          theme_id: string;
          name: string;
          is_active?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          theme_id?: string;
          name?: string;
          is_active?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          salon_id: string;
          category_id: string | null;
          theme_id: string;
          name: string;
          description: string | null;
          sku: string | null;
          price_paise: number;
          currency: 'INR';
          track_inventory: boolean;
          inventory_quantity: number | null;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          category_id?: string | null;
          theme_id: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          price_paise: number;
          currency?: 'INR';
          track_inventory?: boolean;
          inventory_quantity?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          category_id?: string | null;
          theme_id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          price_paise?: number;
          currency?: 'INR';
          track_inventory?: boolean;
          inventory_quantity?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          display_order?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          role: string | null;
          bio: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          role?: string | null;
          bio?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          role?: string | null;
          bio?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          staff_id: string | null;
          appointment_start: string;
          status: BookingStatus;
          total_amount_paise: number;
          advance_amount_paise: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          staff_id?: string | null;
          appointment_start: string;
          status?: BookingStatus;
          total_amount_paise: number;
          advance_amount_paise: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string;
          staff_id?: string | null;
          appointment_start?: string;
          status?: BookingStatus;
          total_amount_paise?: number;
          advance_amount_paise?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      booking_services: {
        Row: {
          id: string;
          booking_id: string;
          salon_id: string;
          service_id: string;
          service_name_snapshot: string;
          price_paise: number;
          duration_minutes: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          salon_id: string;
          service_id: string;
          service_name_snapshot: string;
          price_paise: number;
          duration_minutes: number;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          salon_id?: string;
          service_id?: string;
          service_name_snapshot?: string;
          price_paise?: number;
          duration_minutes?: number;
          quantity?: number;
          created_at?: string;
        };
      };
      booking_slot_holds: {
        Row: {
          id: string;
          salon_id: string;
          customer_id: string;
          service_id: string;
          staff_id: string | null;
          starts_at: string;
          ends_at: string;
          status: 'active' | 'converted' | 'released' | 'expired';
          idempotency_key: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          customer_id: string;
          service_id: string;
          staff_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: 'active' | 'converted' | 'released' | 'expired';
          idempotency_key: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          customer_id?: string;
          service_id?: string;
          staff_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: 'active' | 'converted' | 'released' | 'expired';
          idempotency_key?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      user_private_locations: {
        Row: {
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy_m: number;
          altitude_m: number | null;
          altitude_accuracy_m: number | null;
          speed_mps: number | null;
          heading_degrees: number | null;
          captured_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy_m: number;
          altitude_m?: number | null;
          altitude_accuracy_m?: number | null;
          speed_mps?: number | null;
          heading_degrees?: number | null;
          captured_at: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy_m?: number;
          altitude_m?: number | null;
          altitude_accuracy_m?: number | null;
          speed_mps?: number | null;
          heading_degrees?: number | null;
          captured_at?: string;
          updated_at?: string;
        };
      };
      user_locations: {
        Row: {
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy_m: number | null;
          captured_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy_m?: number | null;
          captured_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy_m?: number | null;
          captured_at?: string;
          updated_at?: string;
        };
      };
      business_locations: {
        Row: {
          salon_id: string;
          latitude: number;
          longitude: number;
          address_label: string;
          approval_status: LocationApprovalStatus;
          submitted_by: string;
          submitted_at: string;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          salon_id: string;
          latitude: number;
          longitude: number;
          address_label: string;
          approval_status?: LocationApprovalStatus;
          submitted_by: string;
          submitted_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          salon_id?: string;
          latitude?: number;
          longitude?: number;
          address_label?: string;
          approval_status?: LocationApprovalStatus;
          submitted_by?: string;
          submitted_at?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      salon_media: {
        Row: {
          id: string;
          salon_id: string;
          theme_id: string | null;
          service_id: string | null;
          product_id: string | null;
          media_type: 'logo' | 'hero' | 'gallery' | 'owner' | 'staff' | 'service' | 'product' | 'video' | 'thumbnail';
          storage_bucket: string | null;
          storage_path: string | null;
          external_url: string | null;
          thumbnail_path: string | null;
          platform: string | null;
          title: string | null;
          description: string | null;
          video_kind: 'short' | 'long' | null;
          status: MediaStatus;
          display_order: number;
          created_by: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          theme_id?: string | null;
          service_id?: string | null;
          product_id?: string | null;
          media_type: 'logo' | 'hero' | 'gallery' | 'owner' | 'staff' | 'service' | 'product' | 'video' | 'thumbnail';
          storage_bucket?: string | null;
          storage_path?: string | null;
          external_url?: string | null;
          thumbnail_path?: string | null;
          platform?: string | null;
          title?: string | null;
          description?: string | null;
          video_kind?: 'short' | 'long' | null;
          status?: MediaStatus;
          display_order?: number;
          created_by: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          theme_id?: string | null;
          service_id?: string | null;
          product_id?: string | null;
          media_type?: 'logo' | 'hero' | 'gallery' | 'owner' | 'staff' | 'service' | 'product' | 'video' | 'thumbnail';
          storage_bucket?: string | null;
          storage_path?: string | null;
          external_url?: string | null;
          thumbnail_path?: string | null;
          platform?: string | null;
          title?: string | null;
          description?: string | null;
          video_kind?: 'short' | 'long' | null;
          status?: MediaStatus;
          display_order?: number;
          created_by?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: JobPortalRole;
          account_status: 'active' | 'suspended' | 'pending_verification' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: JobPortalRole;
          account_status?: 'active' | 'suspended' | 'pending_verification' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: JobPortalRole;
          account_status?: 'active' | 'suspended' | 'pending_verification' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
      };
      job_posts: {
        Row: {
          id: string;
          salon_id: string;
          title: string;
          description: string;
          employment_type: string;
          experience_level: string;
          salary_min: number | null;
          salary_max: number | null;
          status: JobPostStatus;
          created_by: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          title: string;
          description: string;
          employment_type: string;
          experience_level: string;
          salary_min?: number | null;
          salary_max?: number | null;
          status?: JobPostStatus;
          created_by: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          title?: string;
          description?: string;
          employment_type?: string;
          experience_level?: string;
          salary_min?: number | null;
          salary_max?: number | null;
          status?: JobPostStatus;
          created_by?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_user_id: string;
          candidate_profile_id: string;
          resume_id: string | null;
          cover_note: string | null;
          expected_salary: number | null;
          available_from: string | null;
          status: JobApplicationStatus;
          employer_notes: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_user_id: string;
          candidate_profile_id: string;
          resume_id?: string | null;
          cover_note?: string | null;
          expected_salary?: number | null;
          available_from?: string | null;
          status?: JobApplicationStatus;
          employer_notes?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          candidate_user_id?: string;
          candidate_profile_id?: string;
          resume_id?: string | null;
          cover_note?: string | null;
          expected_salary?: number | null;
          available_from?: string | null;
          status?: JobApplicationStatus;
          employer_notes?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      salon_public_websites: {
        Row: {
          id: string;
          salon_id: string;
          slug: string;
          template_key: string;
          config: Json;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          slug: string;
          template_key?: string;
          config?: Json;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          slug?: string;
          template_key?: string;
          config?: Json;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      active_services: {
        Row: {
          id: string;
          salon_id: string;
          theme_id: string | null;
          category_id: string | null;
          name: string;
          description: string | null;
          price_paise: number;
          duration_minutes: number;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
      };
      active_products: {
        Row: {
          id: string;
          salon_id: string;
          category_id: string | null;
          theme_id: string;
          name: string;
          description: string | null;
          sku: string | null;
          price_paise: number;
          currency: string;
          is_active: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
      };
      active_service_categories: {
        Row: {
          id: string;
          theme_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      public_job_listings: {
        Row: {
          id: string;
          salon_id: string;
          title: string;
          description: string;
          employment_type: string;
          experience_level: string;
          salary_min: number | null;
          salary_max: number | null;
          status: string;
          created_at: string;
        };
      };
    };
    Functions: {
      create_authoritative_customer_booking: {
        Args: {
          p_salon_id: string;
          p_service_ids: string[];
          p_appointment_start: string;
          p_idempotency_key: string;
          p_staff_id?: string;
        };
        Returns: Json;
      };
      save_my_private_location: {
        Args: {
          p_latitude: number;
          p_longitude: number;
          p_accuracy_m: number;
          p_altitude_m?: number;
          p_altitude_accuracy_m?: number;
          p_speed_mps?: number;
          p_heading_degrees?: number;
          p_captured_at?: string;
        };
        Returns: boolean;
      };
      clear_my_private_location: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      ensure_growth_partner_identity: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      is_salon_owner: {
        Args: {
          p_salon_id: string;
        };
        Returns: boolean;
      };
      phase2_set_salon_theme: {
        Args: {
          p_salon_id: string;
          p_theme_id: string;
        };
        Returns: Json;
      };
      verify_business_rules: {
        Args: Record<PropertyKey, never>;
        Returns: {
          rule_number: number;
          rule_name: string;
          status: string;
          detail: string;
        }[];
      };
    };
  };
}

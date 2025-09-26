import { createClient } from '@supabase/supabase-js';

// Configuration Supabase simplifiée
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier si Supabase est configuré
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id.supabase.co') && 
  supabaseAnonKey !== 'your-anon-key');

// Client Supabase simple
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mode hors ligne pour les tests
export const offlineMode = {
  enabled: !isSupabaseConfigured
};

// Types de base pour TypeScript
export type Database = {
  public: {
    Tables: {
      websites: {
        Row: {
          id: string;
          url: string;
          domain: string;
          title: string | null;
          meta_description: string | null;
          discovered_at: string;
          last_scraped: string | null;
          page_count: number;
          status: 'discovered' | 'scraped' | 'error';
          user_id: string;
          scraping_data: any;
        };
        Insert: {
          id?: string;
          url: string;
          domain: string;
          title?: string | null;
          meta_description?: string | null;
          discovered_at?: string;
          last_scraped?: string | null;
          page_count?: number;
          status?: 'discovered' | 'scraped' | 'error';
          user_id: string;
          scraping_data?: any;
        };
      };
      analyses: {
        Row: {
          id: string;
          website_id: string;
          user_id: string;
          analysis_type: 'seo' | 'performance' | 'security' | 'forms' | 'links' | 'accessibility';
          status: 'pending' | 'running' | 'completed' | 'failed';
          progress: number;
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
          results: any;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          website_id: string;
          user_id: string;
          analysis_type: 'seo' | 'performance' | 'security' | 'forms' | 'links' | 'accessibility';
          status?: 'pending' | 'running' | 'completed' | 'failed';
          progress?: number;
          started_at?: string;
          completed_at?: string | null;
          error_message?: string | null;
          results?: any;
          session_id?: string | null;
        };
      };
      analysis_sessions: {
        Row: {
          id: string;
          website_id: string;
          user_id: string;
          session_name: string;
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          status: 'created' | 'running' | 'completed' | 'failed' | 'cancelled';
          modules_selected: string[];
          modules_completed: string[];
          overall_score: number | null;
          summary: any;
          metadata: any;
          websites?: {
            url: string;
            domain: string;
            title: string | null;
          };
        };
        Insert: {
          id?: string;
          website_id: string;
          user_id: string;
          session_name: string;
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          status?: 'created' | 'running' | 'completed' | 'failed' | 'cancelled';
          modules_selected?: string[];
          modules_completed?: string[];
          overall_score?: number | null;
          summary?: any;
          metadata?: any;
        };
      };
      seo_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          score: number;
          title: string | null;
          title_length: number | null;
          meta_description: string | null;
          meta_description_length: number | null;
          h1_tags: string[];
          h2_tags: string[];
          word_count: number;
          images_total: number;
          images_without_alt: number;
          internal_links: number;
          external_links: number;
          canonical_url: string | null;
          og_tags: any;
          issues: any;
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          score: number;
          title?: string | null;
          title_length?: number | null;
          meta_description?: string | null;
          meta_description_length?: number | null;
          h1_tags?: string[];
          h2_tags?: string[];
          word_count?: number;
          images_total?: number;
          images_without_alt?: number;
          internal_links?: number;
          external_links?: number;
          canonical_url?: string | null;
          og_tags?: any;
          issues?: any;
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
      performance_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          load_time: number;
          content_size: number;
          resource_count: number;
          compression_enabled: boolean;
          cache_headers: boolean;
          core_web_vitals: any;
          opportunities: any;
          desktop_score: number | null;
          mobile_score: number | null;
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          load_time: number;
          content_size?: number;
          resource_count?: number;
          compression_enabled?: boolean;
          cache_headers?: boolean;
          core_web_vitals?: any;
          opportunities?: any;
          desktop_score?: number | null;
          mobile_score?: number | null;
          analyzed_at?: string;
        };
      };
      security_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          https_enabled: boolean;
          ssl_certificate_valid: boolean;
          ssl_certificate_issuer: string | null;
          ssl_certificate_expires: string | null;
          security_headers: any;
          vulnerabilities: any;
          mixed_content: boolean;
          security_score: number | null;
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          https_enabled?: boolean;
          ssl_certificate_valid?: boolean;
          ssl_certificate_issuer?: string | null;
          ssl_certificate_expires?: string | null;
          security_headers?: any;
          vulnerabilities?: any;
          mixed_content?: boolean;
          security_score?: number | null;
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
      form_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          forms_found: number;
          forms_working: number;
          forms_broken: number;
          has_captcha: boolean;
          captcha_type: string | null;
          captcha_provider: string | null;
          form_details: any;
          email_destinations: string[];
          validation_issues: any;
          accessibility_score: number | null;
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          forms_found?: number;
          forms_working?: number;
          forms_broken?: number;
          has_captcha?: boolean;
          captcha_type?: string | null;
          captcha_provider?: string | null;
          form_details?: any;
          email_destinations?: string[];
          validation_issues?: any;
          accessibility_score?: number | null;
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
      link_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          total_links: number;
          internal_links: number;
          external_links: number;
          broken_links: number;
          redirect_links: number;
          broken_links_details: any;
          redirect_chains: any;
          anchor_analysis: any;
          link_juice_distribution: any;
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          total_links?: number;
          internal_links?: number;
          external_links?: number;
          broken_links?: number;
          redirect_links?: number;
          broken_links_details?: any;
          redirect_chains?: any;
          anchor_analysis?: any;
          link_juice_distribution?: any;
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
      accessibility_results: {
        Row: {
          id: string;
          analysis_id: string;
          website_id: string;
          accessibility_score: number | null;
          wcag_level: string | null;
          issues_critical: number;
          issues_major: number;
          issues_minor: number;
          issues_details: any;
          color_contrast_issues: number;
          keyboard_navigation_score: number | null;
          screen_reader_compatibility: number | null;
          alt_text_coverage: number | null;
          form_labels_coverage: number | null;
          heading_structure_score: number | null;
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          website_id: string;
          accessibility_score?: number | null;
          wcag_level?: string | null;
          issues_critical?: number;
          issues_major?: number;
          issues_minor?: number;
          issues_details?: any;
          color_contrast_issues?: number;
          keyboard_navigation_score?: number | null;
          screen_reader_compatibility?: number | null;
          alt_text_coverage?: number | null;
          form_labels_coverage?: number | null;
          heading_structure_score?: number | null;
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
      domain_whois: {
        Row: {
          id: string;
          website_id: string;
          domain: string;
          registrar: string;
          registrar_url: string | null;
          registrar_iana_id: string | null;
          registrar_abuse_contact_email: string | null;
          registrar_abuse_contact_phone: string | null;
          owner_name: string | null;
          owner_organization: string | null;
          owner_email: string | null;
          owner_phone: string | null;
          owner_address: any;
          admin_contact: any;
          tech_contact: any;
          billing_contact: any;
          creation_date: string;
          expiration_date: string;
          last_updated: string;
          name_servers: string[];
          status: string[];
          dnssec_enabled: boolean;
          privacy_protection: boolean;
          auto_renewal: boolean;
          domain_lock: boolean;
          days_until_expiration: number;
          domain_age: number;
          security_score: number;
          trust_score: number;
          issues: string[];
          recommendations: string[];
          analyzed_at: string;
        };
        Insert: {
          id?: string;
          website_id: string;
          domain: string;
          registrar: string;
          registrar_url?: string | null;
          registrar_iana_id?: string | null;
          registrar_abuse_contact_email?: string | null;
          registrar_abuse_contact_phone?: string | null;
          owner_name?: string | null;
          owner_organization?: string | null;
          owner_email?: string | null;
          owner_phone?: string | null;
          owner_address?: any;
          admin_contact?: any;
          tech_contact?: any;
          billing_contact?: any;
          creation_date: string;
          expiration_date: string;
          last_updated: string;
          name_servers?: string[];
          status?: string[];
          dnssec_enabled?: boolean;
          privacy_protection?: boolean;
          auto_renewal?: boolean;
          domain_lock?: boolean;
          days_until_expiration: number;
          domain_age: number;
          security_score: number;
          trust_score: number;
          issues?: string[];
          recommendations?: string[];
          analyzed_at?: string;
        };
      };
    };
    Enums: {
      analysis_type: 'seo' | 'performance' | 'security' | 'forms' | 'links' | 'accessibility';
      analysis_status: 'pending' | 'running' | 'completed' | 'failed';
      website_status: 'discovered' | 'scraped' | 'error';
      session_status: 'created' | 'running' | 'completed' | 'failed' | 'cancelled';
    };
  };
};
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          type: 'hospital' | 'clinic' | 'restaurant';
          description: string;
          address: string;
          phone: string;
          email: string;
          max_daily_capacity: number;
          avg_service_time: number;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          notification_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      queue_entries: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          queue_number: number;
          status: 'waiting' | 'serving' | 'completed' | 'cancelled';
          estimated_wait_time: number;
          joined_at: string;
          called_at: string | null;
          completed_at: string | null;
          notes: string;
        };
        Insert: Omit<Database['public']['Tables']['queue_entries']['Row'], 'id' | 'joined_at'>;
        Update: Partial<Database['public']['Tables']['queue_entries']['Insert']>;
      };
      business_analytics: {
        Row: {
          id: string;
          business_id: string;
          date: string;
          total_served: number;
          total_cancelled: number;
          avg_wait_time: number;
          peak_hour: number;
        };
        Insert: Omit<Database['public']['Tables']['business_analytics']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['business_analytics']['Insert']>;
      };
    };
  };
};

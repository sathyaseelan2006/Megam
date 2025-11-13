import { createClient } from '@supabase/supabase-js';

// These will be set as environment variables in Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string;
          username: string;
          comment: string;
          rating: number | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          comment: string;
          rating?: number | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          comment?: string;
          rating?: number | null;
          location?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

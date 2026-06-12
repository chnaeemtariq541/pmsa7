import { isSupabaseConfigured } from './client';
import { supabaseDb } from './supabaseDb';
import { localDb } from './localDb';

export const db = isSupabaseConfigured ? supabaseDb : localDb;

export const dbMode: 'supabase' | 'mock' = isSupabaseConfigured ? 'supabase' : 'mock';

// Re-export specific clients if needed directly
export { isSupabaseConfigured } from './client';

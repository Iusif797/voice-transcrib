"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "lesson-media";

let cached: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (cached) return cached;
  if (!url || !key) {
    throw new Error(
      "Supabase не настроен: добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
};

export const isSupabaseConfigured = (): boolean => Boolean(url && key);

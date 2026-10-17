// @ts-nocheck — legacy v1 code, removed in feature/v2-polish
import { createClient } from "@supabase/supabase-js";
import type { DashboardUser } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createDummyQueryResult() {
  return {
    data: null,
    error: new Error("Supabase not configured"),
    count: 0,
  };
}

function createDummyQueryBuilder(table: string) {
  const builder: Record<string, any> = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    or: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (onFulfilled?: any, onRejected?: any) =>
      Promise.resolve(createDummyQueryResult()).then(onFulfilled, onRejected),
    catch: (onRejected?: any) =>
      Promise.resolve(createDummyQueryResult()).catch(onRejected),
    finally: (onFinally?: any) =>
      Promise.resolve(createDummyQueryResult()).finally(onFinally),
  };

  if (import.meta.env.DEV) {
    console.warn(`Supabase not configured - operations on "${table}" use the dummy client.`);
  }

  return builder;
}

function createDummyClient() {
  return {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error("Supabase not configured"),
      }),
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => createDummyQueryBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: new Error("Supabase not configured"),
        }),
        getPublicUrl: () => ({
          data: { publicUrl: "" },
        }),
      }),
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createDummyClient() as any);

export async function getDashboardUserFromSession(sessionUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}) {
  const fallbackUser: DashboardUser = {
    id: sessionUser.id,
    email: sessionUser.email ?? null,
    name:
      sessionUser.user_metadata?.display_name ??
      sessionUser.user_metadata?.name ??
      sessionUser.email?.split("@")[0] ??
      "Administrator",
    username: sessionUser.user_metadata?.username ?? null,
    role: sessionUser.user_metadata?.app_role ?? sessionUser.user_metadata?.role ?? "admin",
    avatarUrl: sessionUser.user_metadata?.avatar_url ?? null,
    lastLogin: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    return fallbackUser;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, app_role, avatar_url")
    .eq("id", sessionUser.id)
    .single();

  if (error || !data) {
    return fallbackUser;
  }

  return {
    id: data.id,
    email: data.email ?? sessionUser.email ?? null,
    name: data.display_name ?? fallbackUser.name,
    username: data.username ?? fallbackUser.username,
    role: data.app_role ?? fallbackUser.role,
    avatarUrl: data.avatar_url ?? fallbackUser.avatarUrl,
    lastLogin: new Date().toISOString(),
  } satisfies DashboardUser;
}

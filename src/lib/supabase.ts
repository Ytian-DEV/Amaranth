// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl && supabaseAnonKey

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient()

export const isSupabaseConfigured = isConfigured

function createDummyClient() {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Supabase environment variables are missing. Using dummy client.')
  }

  return {
    auth: {
      onAuthStateChange: (callback) => {
        console.warn('Supabase not configured - auth state changes disabled')
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      getSession: async () => {
        console.warn('Supabase not configured - returning empty session')
        return { data: { session: null }, error: new Error('Supabase not configured') }
      },
      signOut: async () => {
        console.warn('Supabase not configured - signOut disabled')
        return { error: new Error('Supabase not configured') }
      }
    },
    from: (table) => ({
      select: (query) => {
        console.warn(`Supabase not configured - select from ${table} disabled`)
        return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      },
      insert: (data) => {
        console.warn(`Supabase not configured - insert into ${table} disabled`)
        return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      },
      update: (data) => {
        console.warn(`Supabase not configured - update ${table} disabled`)
        return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      },
      delete: () => {
        console.warn(`Supabase not configured - delete from ${table} disabled`)
        return Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      }
    }),
    channel: (name) => ({
      on: (event, callback) => {
        console.warn('Supabase not configured - realtime channel disabled')
        return { subscribe: () => {} }
      }
    })
  }
}
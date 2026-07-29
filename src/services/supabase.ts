import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getPublicConfig } from '../config'

let client: SupabaseClient | null = null

export function getSupabaseClient() {
  if (client) return client
  const config = getPublicConfig()
  client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  })
  return client
}

export async function startOAuth(provider: 'google' | 'github') {
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) throw error
}

export async function clearLocalSession() {
  await getSupabaseClient().auth.signOut({ scope: 'local' })
}

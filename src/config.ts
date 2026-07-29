export interface PublicConfig {
  apiBaseUrl: string
  supabaseUrl: string
  supabasePublishableKey: string
}

let cachedConfig: PublicConfig | null = null

function requiredValue(name: string, value: string | undefined) {
  const cleanValue = value?.trim()
  if (!cleanValue) {
    throw new Error(`Falta configurar la variable pública ${name}.`)
  }
  return cleanValue
}

export function getPublicConfig(): PublicConfig {
  if (cachedConfig) return cachedConfig

  const apiBaseUrl = requiredValue(
    'VITE_API_BASE_URL',
    import.meta.env.VITE_API_BASE_URL,
  ).replace(/\/+$/, '')
  const supabaseUrl = requiredValue(
    'VITE_SUPABASE_URL',
    import.meta.env.VITE_SUPABASE_URL,
  ).replace(/\/+$/, '')
  const supabasePublishableKey = requiredValue(
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  )

  if (!apiBaseUrl.endsWith('/api/v1')) {
    throw new Error('VITE_API_BASE_URL debe terminar en /api/v1.')
  }

  cachedConfig = {
    apiBaseUrl,
    supabaseUrl,
    supabasePublishableKey,
  }
  return cachedConfig
}

import { getPublicConfig } from '../config'
import type {
  ApiErrorBody,
  CompaniesResponse,
  CompanySettings,
  DocumentsResponse,
  GlobalSettings,
  IndexStatus,
  ModelTestResponse,
  QueryRequest,
  QueryResponse,
  RegisteredCompany,
  RegisterCompanyRequest,
  SyncResponse,
  UpdateEmbeddingsRequest,
  UploadResponse,
  UserEnvironment,
  Visibility,
} from '../types/api'
import { clearLocalSession, getSupabaseClient } from './supabase'

type AuthMode = 'none' | 'required'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown
  readonly sessionExpired: boolean

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
    sessionExpired = false,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.sessionExpired = sessionExpired
  }
}

interface RequestOptions extends RequestInit {
  auth?: AuthMode
  timeoutMs?: number
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object' || !('error' in value)) return false
  const error = value.error
  return (
    !!error &&
    typeof error === 'object' &&
    'codigo' in error &&
    typeof error.codigo === 'string' &&
    'mensaje' in error &&
    typeof error.mensaje === 'string'
  )
}

async function request<T>(
  path: string,
  {
    auth = 'required',
    timeoutMs = 30_000,
    ...options
  }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth === 'required') {
    const {
      data: { session },
    } = await getSupabaseClient().auth.getSession()
    if (!session?.access_token) {
      throw new ApiError(
        'Tu sesión terminó. Inicia sesión nuevamente.',
        401,
        'autenticacion_requerida',
        undefined,
        true,
      )
    }
    headers.set('Authorization', `Bearer ${session.access_token}`)
  } else {
    headers.delete('Authorization')
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetch(`${getPublicConfig().apiBaseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        'El servicio tardó demasiado en responder.',
        0,
        'timeout_api',
      )
    }
    throw new ApiError(
      'No fue posible conectar con el servicio del agente.',
      0,
      'conexion_api',
    )
  } finally {
    window.clearTimeout(timeout)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => undefined)) as unknown
  if (!response.ok) {
    const errorBody = isApiErrorBody(body) ? body : undefined
    const sessionExpired = auth === 'required' && response.status === 401
    if (sessionExpired) {
      await clearLocalSession().catch(() => undefined)
    }
    throw new ApiError(
      errorBody?.error.mensaje || `La operación falló (${response.status}).`,
      response.status,
      errorBody?.error.codigo,
      errorBody?.error.detalles,
      sessionExpired,
    )
  }

  return body as T
}

function queryString(values: Record<string, string | boolean | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value))
  })
  return params.toString()
}

export const api = {
  companies: () =>
    request<CompaniesResponse>('/companies', { auth: 'none' }),

  environment: (loginTarget?: string) =>
    request<UserEnvironment>(
      `/me/environment${
        loginTarget ? `?${queryString({ login_target: loginTarget })}` : ''
      }`,
    ),

  registerCompany: (payload: RegisterCompanyRequest) =>
    request<RegisteredCompany>('/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  companySettings: () =>
    request<CompanySettings>('/me/company/settings'),

  updateCompanySettings: (publicAccessEnabled: boolean) =>
    request<CompanySettings>('/me/company/settings', {
      method: 'PATCH',
      body: JSON.stringify({ public_access_enabled: publicAccessEnabled }),
    }),

  settings: () => request<GlobalSettings>('/settings'),

  updateLlm: (model: string) =>
    request<GlobalSettings>('/settings/llm', {
      method: 'PATCH',
      body: JSON.stringify({ model }),
    }),

  updateEmbeddings: (payload: UpdateEmbeddingsRequest) =>
    request<GlobalSettings>('/settings/embeddings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  testModel: () =>
    request<ModelTestResponse>('/models/test', { method: 'POST' }),

  query: (payload: QueryRequest, authenticated: boolean) =>
    request<QueryResponse>('/queries', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: authenticated ? 'required' : 'none',
      timeoutMs: 90_000,
    }),

  documents: (visibility: Visibility) =>
    request<DocumentsResponse>(
      `/documents?${queryString({ visibility })}`,
    ),

  uploadDocuments: (
    visibility: Visibility,
    files: File[],
    overwrite = false,
  ) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return request<UploadResponse>(
      `/documents?${queryString({
        visibility,
        overwrite,
      })}`,
      { method: 'POST', body: form, timeoutMs: 90_000 },
    )
  },

  deleteDocument: (
    visibility: Visibility,
    name: string,
  ) =>
    request<void>(
      `/documents/${encodeURIComponent(visibility)}/${encodeURIComponent(name)}`,
      { method: 'DELETE' },
    ),

  indexStatus: (visibility?: Visibility) =>
    request<IndexStatus>(
      `/indexes/status${
        visibility ? `?${queryString({ visibility })}` : ''
      }`,
    ),

  syncIndexes: (visibility: Visibility) =>
    request<SyncResponse>('/indexes/sync', {
      method: 'POST',
      body: JSON.stringify({
        modified_visibility: visibility,
      }),
      timeoutMs: 120_000,
    }),
}

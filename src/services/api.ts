import type {
  ApiErrorBody,
  CompaniesResponse,
  DocumentsResponse,
  IndexStatus,
  ModelTestResponse,
  Profile,
  QueryRequest,
  QueryResponse,
  Settings,
  SyncResponse,
  UploadResponse,
  Visibility,
} from '../types/api'

const configuredUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000'

export const API_BASE_URL = configuredUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(
      'No fue posible conectar con el servicio del agente.',
      0,
      'conexion_api',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => undefined)) as
    | ApiErrorBody
    | T
    | undefined

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined
    throw new ApiError(
      errorBody?.error?.mensaje || `La operación falló (${response.status}).`,
      response.status,
      errorBody?.error?.codigo,
      errorBody?.error?.detalles,
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
  health: () => request<{ estado: string }>('/health'),

  companies: () => request<CompaniesResponse>('/api/v1/companies'),

  settings: () => request<Settings>('/api/v1/settings'),

  updateLlm: (model: string) =>
    request<Settings>('/api/v1/settings/llm', {
      method: 'PATCH',
      body: JSON.stringify({ model }),
    }),

  testModel: () =>
    request<ModelTestResponse>('/api/v1/models/test', { method: 'POST' }),

  query: (payload: QueryRequest) =>
    request<QueryResponse>('/api/v1/queries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  documents: (company: string, visibility: Visibility) =>
    request<DocumentsResponse>(
      `/api/v1/documents?${queryString({ company, visibility })}`,
    ),

  uploadDocuments: (
    company: string,
    visibility: Visibility,
    files: File[],
    overwrite = false,
  ) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return request<UploadResponse>(
      `/api/v1/documents?${queryString({
        company,
        visibility,
        overwrite,
      })}`,
      { method: 'POST', body: form },
    )
  },

  deleteDocument: (
    company: string,
    visibility: Visibility,
    name: string,
  ) =>
    request<void>(
      `/api/v1/documents/${encodeURIComponent(visibility)}/${encodeURIComponent(name)}?${queryString({ company })}`,
      { method: 'DELETE' },
    ),

  indexStatus: (
    company: string,
    profile: Profile,
    visibility?: Visibility,
  ) =>
    request<IndexStatus>(
      `/api/v1/indexes/status?${queryString({
        company,
        profile,
        visibility,
      })}`,
    ),

  syncIndexes: (company: string, visibility: Visibility) =>
    request<SyncResponse>('/api/v1/indexes/sync', {
      method: 'POST',
      body: JSON.stringify({
        company,
        modified_visibility: visibility,
      }),
    }),
}

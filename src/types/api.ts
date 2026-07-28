export type Profile = 'public' | 'internal'
export type Visibility = 'Public' | 'Private'

export interface Company {
  name: string
}

export interface CompaniesResponse {
  active_company: string
  companies: Company[]
}

export interface Settings {
  active_company: string
  allowed_visibilities: string[]
  llm_model: string
  embedding_model: string
  embedding_dimensions: number
  reindex_pending: boolean
  supported_upload_extensions: string[]
}

export interface ModelTestResponse {
  success: boolean
  model: string
  response: string
  http_code: number | null
  status: string | null
}

export interface DocumentItem {
  name: string
  relative_path: string
  visibility: Visibility
  size_bytes: number
}

export interface DocumentsResponse {
  company: string
  visibility: Visibility
  count: number
  documents: DocumentItem[]
}

export interface UploadResponse {
  company: string
  visibility: Visibility
  saved_count: number
  saved_files: string[]
}

export interface IndexStatus {
  company: string
  profile: Profile
  visibility: Visibility | null
  fragment_count: number
  last_complete_indexing: string | null
}

export interface SyncResult {
  profile: Profile
  company: string
  fragment_count: number
  new: number
  updated: number
  unchanged: number
  deleted: number
  complete: boolean
}

export interface SyncResponse {
  results: SyncResult[]
}

export interface Source {
  file: string
  section: string
  fragment_reference: string
  visibility: string
  file_type: string
  page: number | null
}

export interface QueryRequest {
  question: string
  company: string
  profile: Profile
  top_k: number
}

export interface QueryResponse {
  company: string
  profile: Profile
  model: string
  answer: {
    text: string
    information_found: boolean
  }
  sources: Source[]
  diagnostics: {
    retrieved_fragments: number
    elapsed_seconds: number
  }
}

export interface ApiErrorBody {
  error?: {
    codigo?: string
    mensaje?: string
    detalles?: unknown
  }
}

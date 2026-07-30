import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserEnvironment } from './types/api'

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number
    code?: string
    details?: unknown
    sessionExpired: boolean

    constructor(
      message: string,
      status: number,
      code?: string,
      sessionExpired = false,
    ) {
      super(message)
      this.status = status
      this.code = code
      this.sessionExpired = sessionExpired
    }
  }

  return {
    MockApiError,
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    startOAuth: vi.fn(),
    trackAuthenticationEvent: vi.fn(),
    companies: vi.fn(),
    environment: vi.fn(),
    settings: vi.fn(),
    query: vi.fn(),
    registerCompany: vi.fn(),
    documents: vi.fn(),
    indexStatus: vi.fn(),
    updateCompanySettings: vi.fn(),
    updateLlm: vi.fn(),
    updateEmbeddings: vi.fn(),
    testModel: vi.fn(),
    uploadDocuments: vi.fn(),
    deleteDocument: vi.fn(),
    syncIndexes: vi.fn(),
  }
})

vi.mock('./services/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
  }),
  startOAuth: mocks.startOAuth,
}))

vi.mock('./services/api', () => ({
  ApiError: mocks.MockApiError,
  api: {
    companies: mocks.companies,
    environment: mocks.environment,
    settings: mocks.settings,
    query: mocks.query,
    registerCompany: mocks.registerCompany,
    documents: mocks.documents,
    indexStatus: mocks.indexStatus,
    updateCompanySettings: mocks.updateCompanySettings,
    updateLlm: mocks.updateLlm,
    updateEmbeddings: mocks.updateEmbeddings,
    testModel: mocks.testModel,
    uploadDocuments: mocks.uploadDocuments,
    deleteDocument: mocks.deleteDocument,
    syncIndexes: mocks.syncIndexes,
  },
}))

vi.mock('./services/analytics', () => ({
  trackAuthenticationEvent: mocks.trackAuthenticationEvent,
}))

import App from './App'

const catalog = {
  default_company: 'alianzaf1',
  companies: [
    { name: 'Alianza F1', knowledge_key: 'alianzaf1' },
    { name: 'Empresa Pública', knowledge_key: 'publica' },
  ],
}

const adminEnvironment: UserEnvironment = {
  user_id: '11111111-1111-4111-8111-111111111111',
  platform_role: 'user',
  company_id: '22222222-2222-4222-8222-222222222222',
  company_name: 'Empresa Privada',
  knowledge_key: 'privada',
  membership_role: 'admin',
  document_scope: ['Public', 'Private'],
  company_settings: {
    public_access_enabled: false,
    reindex_pending: false,
  },
  supported_upload_extensions: ['.md', '.pdf'],
}

const queryResponse = {
  company: 'alianzaf1',
  profile: 'public' as const,
  model: 'gemini-flash',
  answer: { text: 'Respuesta empresarial', information_found: true },
  sources: [],
  diagnostics: { retrieved_fragments: 3, elapsed_seconds: 0.42 },
}

describe('flujos principales de App', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.getSession.mockResolvedValue({ data: { session: null } })
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mocks.signOut.mockResolvedValue({ error: null })
    mocks.companies.mockResolvedValue(catalog)
    mocks.environment.mockResolvedValue(adminEnvironment)
    mocks.query.mockResolvedValue(queryResponse)
    mocks.settings.mockResolvedValue({
      llm_model: 'gemini-flash',
      embedding_model: 'embedding-model',
      embedding_dimensions: 768,
    })
    mocks.registerCompany.mockResolvedValue({
      name: 'Nueva Empresa',
      knowledge_key: 'nuevaempresa',
      role: 'admin',
      public_access_enabled: true,
    })
  })

  it('registra el inicio de autenticación con intención y proveedor', async () => {
    render(<App />)
    const user = userEvent.setup()

    await screen.findByRole('combobox', { name: 'Empresa pública' })
    await user.click(
      screen.getByRole('button', {
        name: 'Ya tengo una cuenta — Iniciar sesión',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar con Google' }),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Volver a las opciones de acceso',
      }),
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Crear un agente para mi empresa',
      }),
    )
    expect(
      screen.getByRole('heading', {
        name: 'Convierte la información de tu empresa en respuestas inmediatas',
      }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Continuar con GitHub' }),
    )

    expect(mocks.trackAuthenticationEvent).toHaveBeenNthCalledWith(
      1,
      'login_start',
      'google',
    )
    expect(mocks.trackAuthenticationEvent).toHaveBeenNthCalledWith(
      2,
      'sign_up_start',
      'github',
    )
  })

  it('presenta la propuesta de valor y permite volver al agente público', async () => {
    render(<App />)
    const user = userEvent.setup()

    await screen.findByRole('combobox', { name: 'Empresa pública' })
    await user.click(
      screen.getByRole('button', {
        name: 'Crear un agente para mi empresa',
      }),
    )

    expect(
      screen.getByText('Agente empresarial con IA'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Respuestas con fuentes verificables'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Implementación acompañada'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/El registro inicial no requiere datos de pago/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Conocer más sobre el producto' }),
    ).toHaveAttribute(
      'href',
      'https://tecnologiaydesarrolloweb.com/agente-ia',
    )
    expect(
      screen.getByRole('link', { name: 'Conocer más sobre el producto' }),
    ).not.toHaveAttribute('target')

    await user.click(
      screen.getByRole('button', { name: 'Volver al agente público' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Empresa pública' }),
    ).toBeInTheDocument()
  })

  it('selecciona default_company y consulta como viewer con company', async () => {
    render(<App />)
    const user = userEvent.setup()

    expect(
      await screen.findByRole('combobox', { name: 'Empresa pública' }),
    ).toHaveTextContent('Alianza F1')
    await user.type(screen.getByLabelText('Escribe tu pregunta'), 'Pregunta')
    await user.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

    await waitFor(() =>
      expect(mocks.query).toHaveBeenCalledWith(
        { question: 'Pregunta', company: 'alianzaf1', top_k: 5 },
        false,
      ),
    )
    expect(await screen.findByText('Respuesta empresarial')).toBeInTheDocument()
    expect(screen.getByText('gemini-flash')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('personaliza el saludo con la empresa seleccionada en el combo', async () => {
    render(<App />)
    const user = userEvent.setup()

    const companySelect = await screen.findByRole('combobox', {
      name: 'Empresa pública',
    })
    expect(
      await screen.findByText(
        '¡Hola! Soy el agente empresarial de Alianza F1.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Respondo preguntas usando información autorizada de la empresa y te muestro las fuentes consultadas.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Puedes probarme preguntando por nuestros servicios, tecnologías o proceso de trabajo.',
      ),
    ).toBeInTheDocument()

    await user.click(companySelect)
    await user.click(screen.getByRole('option', { name: 'Empresa Pública' }))

    expect(
      await screen.findByText(
        '¡Hola! Soy el agente empresarial de Empresa Pública.',
      ),
    ).toBeInTheDocument()
  })

  it('restaura sesión, fija empresa y consulta sin company', async () => {
    sessionStorage.setItem('auth-intent', 'login')
    sessionStorage.setItem('auth-provider', 'google')
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })
    mocks.query.mockResolvedValue({
      ...queryResponse,
      company: 'privada',
      profile: 'internal',
    })
    render(<App />)
    const user = userEvent.setup()

    expect((await screen.findAllByText('Empresa Privada')).length).toBeGreaterThan(0)
    expect(mocks.trackAuthenticationEvent).toHaveBeenCalledWith(
      'login',
      'google',
    )
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Escribe tu pregunta'), 'Interna')
    await user.click(screen.getByRole('button', { name: 'Enviar pregunta' }))

    await waitFor(() =>
      expect(mocks.query).toHaveBeenCalledWith(
        { question: 'Interna', company: undefined, top_k: 5 },
        true,
      ),
    )
  })

  it('muestra registro cuando el usuario autenticado no tiene empresa', async () => {
    sessionStorage.setItem('auth-intent', 'register')
    sessionStorage.setItem('auth-provider', 'github')
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })
    mocks.environment
      .mockRejectedValueOnce(
        new mocks.MockApiError(
          'Completa el registro.',
          409,
          'usuario_sin_empresa',
        ),
      )
      .mockResolvedValue(adminEnvironment)
    render(<App />)
    const user = userEvent.setup()

    expect(
      await screen.findByRole('heading', { name: 'Registra tu empresa gratis' }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre de la empresa'), 'Nueva Empresa')
    await user.click(screen.getByText(/Habilitar acceso público/))
    await user.click(screen.getByRole('button', { name: 'Crear empresa' }))

    await waitFor(() =>
      expect(mocks.registerCompany).toHaveBeenCalledWith({
        name: 'Nueva Empresa',
        public_access_enabled: true,
      }),
    )
    expect(mocks.trackAuthenticationEvent).toHaveBeenCalledWith(
      'sign_up',
      'github',
    )
    expect((await screen.findAllByText('Empresa Privada')).length).toBeGreaterThan(0)
  })

  it('no degrada silenciosamente una sesión expirada', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'expired' } },
    })
    mocks.environment.mockRejectedValueOnce(
      new mocks.MockApiError(
        'La sesión expiró.',
        401,
        'token_invalido',
        true,
      ),
    )
    render(<App />)

    expect(
      await screen.findByText(/Tu sesión venció/i),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('combobox', { name: 'Empresa pública' }),
    ).toHaveTextContent('Alianza F1')
  })

  it('bloquea el chat si el catálogo público no está disponible', async () => {
    mocks.companies.mockRejectedValueOnce(new Error('Backend no disponible'))
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Backend no disponible',
    )
    expect(screen.getByLabelText('Escribe tu pregunta')).toBeDisabled()
  })
})

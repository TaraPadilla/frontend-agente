import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  clearLocalSession: vi.fn(),
}))

vi.mock('../config', () => ({
  getPublicConfig: () => ({
    apiBaseUrl: 'http://localhost:8000/api/v1',
    supabaseUrl: 'https://project.supabase.co',
    supabasePublishableKey: 'public-key',
  }),
}))

vi.mock('./supabase', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: authMocks.getSession },
  }),
  clearLocalSession: authMocks.clearLocalSession,
}))

import { api } from './api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('cliente FastAPI', () => {
  beforeEach(() => {
    authMocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
    })
    authMocks.clearLocalSession.mockResolvedValue(undefined)
    vi.stubGlobal('fetch', vi.fn())
  })

  it('carga el catálogo público sin Bearer', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        default_company: 'alianzaf1',
        companies: [{ name: 'Alianza F1', knowledge_key: 'alianzaf1' }],
      }),
    )

    await api.companies()

    const [url, options] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/v1/companies')
    expect(new Headers(options?.headers).has('Authorization')).toBe(false)
    expect(authMocks.getSession).not.toHaveBeenCalled()
  })

  it('envía la consulta viewer con company y sin Bearer', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        company: 'alianzaf1',
        profile: 'public',
        model: 'llm',
        answer: { text: 'Respuesta', information_found: true },
        sources: [],
        diagnostics: { retrieved_fragments: 2, elapsed_seconds: 0.4 },
      }),
    )

    await api.query(
      { question: 'Pregunta', company: 'alianzaf1', top_k: 5 },
      false,
    )

    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(new Headers(options?.headers).has('Authorization')).toBe(false)
    expect(JSON.parse(String(options?.body))).toEqual({
      question: 'Pregunta',
      company: 'alianzaf1',
      top_k: 5,
    })
  })

  it('envía la consulta autenticada sin company y con Bearer', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        company: 'privada',
        profile: 'internal',
        model: 'llm',
        answer: { text: 'Respuesta', information_found: true },
        sources: [],
        diagnostics: { retrieved_fragments: 1, elapsed_seconds: 0.2 },
      }),
    )

    await api.query({ question: 'Pregunta', top_k: 5 }, true)

    const [, options] = vi.mocked(fetch).mock.calls[0]
    expect(new Headers(options?.headers).get('Authorization')).toBe(
      'Bearer access-token',
    )
    expect(JSON.parse(String(options?.body))).not.toHaveProperty('company')
  })

  it.each([
    [403, 'empresa_no_autorizada'],
    [409, 'knowledge_key_duplicado'],
    [422, 'solicitud_invalida'],
  ])('conserva RespuestaError para HTTP %s', async (status, code) => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        { error: { codigo: code, mensaje: `Error ${status}` } },
        status,
      ),
    )

    await expect(api.environment()).rejects.toMatchObject({
      status,
      code,
      message: `Error ${status}`,
    })
  })

  it('limpia la sesión local ante un 401 protegido', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(
        {
          error: {
            codigo: 'token_invalido',
            mensaje: 'La sesión expiró.',
          },
        },
        401,
      ),
    )

    await expect(api.environment()).rejects.toMatchObject({
      status: 401,
      sessionExpired: true,
    })
    expect(authMocks.clearLocalSession).toHaveBeenCalledOnce()
  })

  it('normaliza un fallo de conexión sin exponer objetos crudos', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('network'))

    await expect(api.companies()).rejects.toEqual(
      expect.objectContaining({
        status: 0,
        code: 'conexion_api',
        message: 'No fue posible conectar con el servicio del agente.',
      }),
    )
  })
})

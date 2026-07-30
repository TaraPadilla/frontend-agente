import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { UserEnvironment } from '../types/api'
import { Sidebar } from './Sidebar'

function environment(
  membershipRole: UserEnvironment['membership_role'] = 'admin',
  platformRole: UserEnvironment['platform_role'] = 'user',
): UserEnvironment {
  return {
    user_id: crypto.randomUUID(),
    platform_role: platformRole,
    company_id: crypto.randomUUID(),
    company_name: 'Empresa Privada',
    knowledge_key: 'privada',
    membership_role: membershipRole,
    document_scope: ['Public', 'Private'],
    company_settings: {
      public_access_enabled: false,
      reindex_pending: false,
    },
    supported_upload_extensions: ['.pdf'],
  }
}

function renderSidebar(
  currentEnvironment: UserEnvironment | null,
  onAuthenticate = vi.fn(),
  onOpenRegistration = vi.fn(),
) {
  render(
    <Sidebar
      activeView="chat"
      companies={[
        { name: 'Alianza F1', knowledge_key: 'alianzaf1' },
        { name: 'Pública', knowledge_key: 'publica' },
      ]}
      company="alianzaf1"
      environment={currentEnvironment}
      onAuthenticate={onAuthenticate}
      onClose={vi.fn()}
      onCompanyChange={vi.fn()}
      onLogout={vi.fn()}
      onNavigate={vi.fn()}
      onOpenRegistration={onOpenRegistration}
      onToggle={vi.fn()}
      open
    />,
  )
  return onAuthenticate
}

describe('navegación por permisos', () => {
  it('muestra solo las dos acciones de acceso antes de elegir un flujo', async () => {
    const authenticate = renderSidebar(null)
    const user = userEvent.setup()

    expect(
      screen.getByRole('combobox', { name: 'Empresa pública' }),
    ).toHaveTextContent('Alianza F1')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Crear un agente para mi empresa',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Ya tengo una cuenta — Iniciar sesión',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Continuar con Google' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'Ya tengo una cuenta — Iniciar sesión',
      }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar con Google' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Continuar con GitHub' }),
    )

    expect(authenticate).toHaveBeenNthCalledWith(1, 'login', 'google')
    expect(authenticate).toHaveBeenNthCalledWith(2, 'login', 'github')
  })

  it('abre el selector completo y cambia la empresa desde el menú estilizado', async () => {
    const onCompanyChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Sidebar
        activeView="chat"
        companies={[
          { name: 'Alianza F1', knowledge_key: 'alianzaf1' },
          { name: 'Pública', knowledge_key: 'publica' },
        ]}
        company="alianzaf1"
        environment={null}
        onAuthenticate={vi.fn()}
        onClose={vi.fn()}
        onCompanyChange={onCompanyChange}
        onLogout={vi.fn()}
        onNavigate={vi.fn()}
        onOpenRegistration={vi.fn()}
        onToggle={vi.fn()}
        open
      />,
    )

    await user.click(
      screen.getByRole('combobox', { name: 'Empresa pública' }),
    )

    expect(
      screen.getByRole('listbox', { name: 'Empresa pública' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Pública' }))

    expect(onCompanyChange).toHaveBeenCalledWith('publica')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('abre la vista dedicada desde la acción de crear un agente', async () => {
    const openRegistration = vi.fn()
    renderSidebar(null, vi.fn(), openRegistration)
    const user = userEvent.setup()

    await user.click(
      screen.getByRole('button', {
        name: 'Crear un agente para mi empresa',
      }),
    )

    expect(openRegistration).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole('button', { name: 'Continuar con Google' }),
    ).not.toBeInTheDocument()
  })

  it('fija la empresa y habilita administración para admin', () => {
    renderSidebar(environment())

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Empresa Privada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archivos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configuración' })).toBeInTheDocument()
  })

  it('no muestra navegación administrativa a editor', () => {
    renderSidebar(environment('editor'))

    expect(screen.queryByRole('button', { name: 'Archivos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Configuración' })).not.toBeInTheDocument()
  })

  it('conserva la empresa propia para superadmin', () => {
    renderSidebar(environment('admin', 'superadmin'))

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Empresa Privada')).toBeInTheDocument()
  })
})

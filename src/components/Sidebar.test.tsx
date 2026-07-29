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
      onToggle={vi.fn()}
      open
    />,
  )
  return onAuthenticate
}

describe('navegación por permisos', () => {
  it('muestra selector público y OAuth Google/GitHub al viewer', async () => {
    const authenticate = renderSidebar(null)
    const user = userEvent.setup()

    expect(screen.getByRole('combobox', { name: 'Empresa pública' })).toHaveValue(
      'alianzaf1',
    )
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión con Google' }))
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión con GitHub' }))

    expect(authenticate).toHaveBeenNthCalledWith(1, 'login', 'google')
    expect(authenticate).toHaveBeenNthCalledWith(2, 'login', 'github')
  })

  it('ofrece registro con Google y GitHub', async () => {
    const authenticate = renderSidebar(null)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Registra tu empresa gratis' }))
    await user.click(screen.getByRole('button', { name: 'Registrar con GitHub' }))

    expect(authenticate).toHaveBeenNthCalledWith(1, 'register', 'google')
    expect(authenticate).toHaveBeenNthCalledWith(2, 'register', 'github')
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

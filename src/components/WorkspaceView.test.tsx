import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Visibility } from '../types/api'
import { WorkspaceView } from './WorkspaceView'

const emptyByVisibility = <T,>(value: T): Record<Visibility, T> => ({
  Public: value,
  Private: value,
})

const baseProps = {
  busyAction: null,
  company: 'Empresa Privada',
  companySettings: {
    public_access_enabled: false,
    reindex_pending: true,
  },
  documents: emptyByVisibility([]),
  extensions: ['.md', '.pdf'],
  globalSettings: {
    llm_model: 'gemini-flash',
    embedding_model: 'embedding-model',
    embedding_dimensions: 768,
  },
  indexStatus: emptyByVisibility(null),
  modelTest: null,
  onDelete: vi.fn().mockResolvedValue(true),
  onPublicAccessChange: vi.fn().mockResolvedValue(undefined),
  onSaveEmbeddings: vi.fn().mockResolvedValue(undefined),
  onSaveModel: vi.fn().mockResolvedValue(undefined),
  onSync: vi.fn().mockResolvedValue(undefined),
  onTestModel: vi.fn().mockResolvedValue(undefined),
  onUpload: vi.fn().mockResolvedValue(true),
  syncResults: emptyByVisibility(null),
}

describe('área administrativa', () => {
  it('muestra únicamente configuración empresarial a admin', () => {
    render(
      <WorkspaceView
        {...baseProps}
        superadmin={false}
        view="settings"
      />,
    )

    expect(screen.getByText('Configuración empresarial')).toBeInTheDocument()
    expect(screen.getByText(/requiere reindexación/i)).toBeInTheDocument()
    expect(
      screen.queryByText('Configuración global de plataforma'),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Modelo de embeddings')).not.toBeInTheDocument()
  })

  it('muestra configuración global de embeddings solo a superadmin', () => {
    render(
      <WorkspaceView
        {...baseProps}
        superadmin
        view="settings"
      />,
    )

    expect(screen.getByText('Configuración global de plataforma')).toBeInTheDocument()
    expect(screen.getByLabelText('Modelo de embeddings')).toHaveValue(
      'embedding-model',
    )
    expect(screen.getByText(/cambiar el LLM no requiere/i)).toBeInTheDocument()
  })

  it('presenta documentos, estado y último resultado de sincronización', () => {
    render(
      <WorkspaceView
        {...baseProps}
        documents={{
          Public: [
            {
              name: 'manual.pdf',
              relative_path: 'Public/manual.pdf',
              visibility: 'Public',
              size_bytes: 2048,
            },
          ],
          Private: [],
        }}
        indexStatus={{
          Public: {
            company: 'privada',
            profile: 'internal',
            visibility: 'Public',
            fragment_count: 12,
            last_complete_indexing: null,
          },
          Private: null,
        }}
        superadmin={false}
        syncResults={{
          Public: [
            {
              profile: 'internal',
              company: 'privada',
              fragment_count: 12,
              new: 3,
              updated: 1,
              unchanged: 8,
              deleted: 0,
              complete: true,
            },
          ],
          Private: null,
        }}
        view="files"
      />,
    )

    expect(screen.getByText('manual.pdf')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText(/3 nuevos, 1 actualizados/i)).toBeInTheDocument()
  })
})

import { render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GoogleAnalytics } from './GoogleAnalytics'

function analyticsCalls() {
  return (window.dataLayer ??[]) as unknown[][]
}

afterEach(() => {
  vi.unstubAllEnvs()
  document.querySelectorAll('script[data-ga4-id]').forEach((script) => {
    script.remove()
  })
  delete window.dataLayer
  delete window.gtag
  delete window.__alianzaF1GaId
  delete window.__alianzaF1LastPageView
  window.history.replaceState({}, '', '/')
})

describe('GoogleAnalytics', () => {
  it('does not load GA4 without a valid measurement ID', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'invalid-id')

    render(<GoogleAnalytics />)

    expect(document.querySelector('script[data-ga4-id]')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })

  it('loads GA4 and sends one sanitized page view under StrictMode', async () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-FN337E83YN')
    window.history.replaceState({}, '', '/agente?code=oauth-code#access_token=token')

    render(
      <StrictMode>
        <GoogleAnalytics />
      </StrictMode>,
    )

    await waitFor(() => {
      expect(
        analyticsCalls().filter(
          ([command, event]) => command === 'event' && event === 'page_view',
        ),
      ).toHaveLength(1)
    })

    expect(
      document.querySelector<HTMLScriptElement>(
        'script[data-ga4-id="G-FN337E83YN"]',
      )?.src,
    ).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-FN337E83YN',
    )
    expect(analyticsCalls()).toContainEqual([
      'config',
      'G-FN337E83YN',
      { send_page_view: false },
    ])
    expect(analyticsCalls()).toContainEqual([
      'event',
      'page_view',
      {
        send_to: 'G-FN337E83YN',
        page_title: document.title,
        page_location: `${window.location.origin}/agente`,
      },
    ])
  })
})

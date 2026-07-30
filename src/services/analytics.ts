const measurementIdPattern = /^G-[A-Z0-9]+$/

export type AuthenticationAnalyticsEvent =
  | 'login_start'
  | 'sign_up_start'
  | 'login'
  | 'sign_up'

export type AuthenticationMethod = 'google' | 'github'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __alianzaF1GaId?: string
    __alianzaF1LastPageView?: string
  }
}

function getMeasurementId() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
  return measurementId && measurementIdPattern.test(measurementId)
    ? measurementId
    : null
}

export function initializeGoogleAnalytics() {
  const measurementId = getMeasurementId()
  if (!measurementId) return null

  window.dataLayer ??= []
  window.gtag ??= (...args: unknown[]) => {
    window.dataLayer?.push(args)
  }

  if (!document.querySelector(`script[data-ga4-id="${measurementId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    script.dataset.ga4Id = measurementId
    document.head.append(script)
  }

  if (window.__alianzaF1GaId !== measurementId) {
    window.gtag('js', new Date())
    window.gtag('config', measurementId, { send_page_view: false })
    window.__alianzaF1GaId = measurementId
  }

  return measurementId
}

export function sendPageView(measurementId: string) {
  if (!window.gtag) return

  const pageLocation = `${window.location.origin}${window.location.pathname}`
  const pageKey = `${measurementId}:${window.location.pathname}`
  if (window.__alianzaF1LastPageView === pageKey) return

  window.__alianzaF1LastPageView = pageKey
  window.gtag('event', 'page_view', {
    send_to: measurementId,
    page_title: document.title,
    page_location: pageLocation,
  })
}

export function trackAuthenticationEvent(
  eventName: AuthenticationAnalyticsEvent,
  method: AuthenticationMethod,
) {
  const measurementId = getMeasurementId()
  if (!measurementId || !window.gtag) return

  window.gtag('event', eventName, {
    send_to: measurementId,
    method,
  })
}

import { useEffect } from 'react'

const measurementIdPattern = /^G-[A-Z0-9]+$/

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

function initializeGoogleAnalytics(measurementId: string) {
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
}

function sendPageView(measurementId: string) {
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

export function GoogleAnalytics() {
  useEffect(() => {
    const measurementId = getMeasurementId()
    if (!measurementId) return

    initializeGoogleAnalytics(measurementId)

    const animationFrame = window.requestAnimationFrame(() => {
      sendPageView(measurementId)
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  return null
}

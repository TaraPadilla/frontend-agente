import { useEffect } from 'react'
import {
  initializeGoogleAnalytics,
  sendPageView,
} from '../services/analytics'

export function GoogleAnalytics() {
  useEffect(() => {
    const measurementId = initializeGoogleAnalytics()
    if (!measurementId) return

    const animationFrame = window.requestAnimationFrame(() => {
      sendPageView(measurementId)
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  return null
}

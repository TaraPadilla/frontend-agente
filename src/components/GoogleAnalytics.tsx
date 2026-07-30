import { useEffect } from 'react'
import {
  initializeGoogleAnalytics,
  sendPageView,
} from '../services/analytics'
import { subscribeToNavigation } from '../services/navigation'

export function GoogleAnalytics() {
  useEffect(() => {
    const configuredMeasurementId = initializeGoogleAnalytics()
    if (!configuredMeasurementId) return
    const measurementId: string = configuredMeasurementId

    let animationFrame: number | null = null
    function sendCurrentPageView() {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
      animationFrame = window.requestAnimationFrame(() => {
        sendPageView(measurementId)
        animationFrame = null
      })
    }

    sendCurrentPageView()
    const unsubscribe = subscribeToNavigation(sendCurrentPageView)
    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
      unsubscribe()
    }
  }, [])

  return null
}

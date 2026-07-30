export const CHAT_PATH = '/'
export const REGISTRATION_PATH = '/registro'

export type PublicRoute = 'chat' | 'registration'

const navigationEvent = 'alianzaf1:navigation'

export function getPublicRoute(pathname = window.location.pathname): PublicRoute {
  return pathname === REGISTRATION_PATH ? 'registration' : 'chat'
}

export function navigateTo(path: string, replace = false) {
  if (window.location.pathname === path) return

  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }
  window.dispatchEvent(new Event(navigationEvent))
}

export function subscribeToNavigation(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener(navigationEvent, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(navigationEvent, listener)
  }
}

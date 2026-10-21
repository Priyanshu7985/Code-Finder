import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * Lightweight in-memory screen navigation. The game is a single
 * full-screen experience, so a router dependency is unnecessary;
 * screens are swapped without reloading the page.
 */
export const SCREENS = ['boot', 'menu', 'missions', 'workspace', 'training', 'achievements', 'settings', 'profile']

const NavigationContext = createContext(null)

export function NavigationProvider({ initialScreen = 'boot', children }) {
  const [route, setRoute] = useState({ screen: initialScreen, params: {} })

  const navigate = useCallback((screen, params = {}) => {
    if (!SCREENS.includes(screen)) return
    setRoute({ screen, params })
  }, [])

  const value = useMemo(() => ({ ...route, navigate }), [route, navigate])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>')
  return ctx
}

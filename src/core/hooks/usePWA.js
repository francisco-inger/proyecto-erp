import { useState, useEffect, useCallback } from 'react'

let deferredInstallPrompt = null

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    )
  })
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Detección de iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream
    setIsIOS(isAppleDevice)

    // Si ya fue guardado un prompt previo
    if (deferredInstallPrompt) {
      setIsInstallable(true)
    }

    // Escuchador del evento beforeinstallprompt (Chrome, Edge, Opera, Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredInstallPrompt = e
      setIsInstallable(true)
    }

    // Escuchador de app instalada
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      deferredInstallPrompt = null
    }

    // Escuchadores de conectividad de red
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt()
      const { outcome } = await deferredInstallPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }
      deferredInstallPrompt = null
      return outcome === 'accepted'
    }
    return false
  }, [])

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isIOS,
    promptInstall
  }
}

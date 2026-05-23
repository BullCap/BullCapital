'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    // Apenas registra o Service Worker em ambiente de produção/navegador
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.hostname !== 'localhost'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA Service Worker registrado com sucesso no escopo:', registration.scope)
          })
          .catch((error) => {
            console.error('Falha ao registrar o PWA Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}

import { useEffect, useState } from 'react'

const pageToHash = {
  home: 'beranda',
  tracking: 'lacak-sampel',
  status: 'status',
  survey: 'pengisian-survey',
}

function parseHash() {
  const raw = window.location.hash.slice(1)
  const [path, query] = raw.split('?')
  const params = new URLSearchParams(query || '')
  const kode = params.get('kode') || ''

  switch (path) {
    case 'lacak-sampel':
      return { page: 'tracking', kode }
    case 'status':
      return { page: 'status', kode }
    case 'pengisian-survey':
      return { page: 'survey', kode }
    default:
      return { page: 'home', kode }
  }
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const syncHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function navigate(nextPage, kode = '') {
    const hashKey = pageToHash[nextPage] ?? pageToHash.home
    window.location.hash = kode ? `${hashKey}?kode=${encodeURIComponent(kode)}` : hashKey
    setRoute({ page: nextPage, kode })
  }

  return { page: route.page, kode: route.kode, navigate }
}
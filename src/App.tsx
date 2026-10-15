import { useEffect, useState } from 'react'
import { ChaosNav } from '@/components/ChaosNav'
import { ChaosIDPage } from '@/components/ChaosIDPage'
import { ChaosBoardPage } from '@/components/ChaosBoardPage'
import { ChaosMarketPage } from '@/components/ChaosMarketPage'
import { LandingPage } from '@/components/LandingPage'
import { BridgePage } from '@/components/BridgePage'
import { DocsPage } from '@/components/DocsPage'
import { CRTScanlines, PhosphorVignette } from '@/components/CRTOverlay'
import type { Page } from '@/types'

// Detect profile-share URL at init time (no effect needed)
function getInitialState(): { showLanding: boolean; page: Page; sharedAddress: string | null } {
  if (window.location.pathname === '/docs') return { showLanding: false, page: 'docs', sharedAddress: null }
  const match = window.location.pathname.match(/^\/id\/(0x[0-9a-fA-F]{40})$/)
  if (match) return { showLanding: false, page: 'id', sharedAddress: match[1] }
  return { showLanding: true, page: 'id', sharedAddress: null }
}

const INITIAL = getInitialState()

export default function App() {
  const [showLanding, setShowLanding] = useState(INITIAL.showLanding)
  const [page, setPage] = useState<Page>(INITIAL.page)
  const [sharedAddress, setSharedAddress] = useState(INITIAL.sharedAddress)

  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname
      const profile = path.match(/^\/id\/(0x[0-9a-fA-F]{40})$/)
      setShowLanding(path === '/')
      setPage(path === '/docs' ? 'docs' : 'id')
      setSharedAddress(profile?.[1] ?? null)
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const navigate = (nextPage: Page) => {
    setShowLanding(false)
    setPage(nextPage)
    setSharedAddress(null)
    const path = nextPage === 'docs' ? '/docs' : '/'
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
  }

  if (showLanding) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a]">
        <CRTScanlines opacity={0.03} />
        <PhosphorVignette />
        <LandingPage onEnter={() => navigate('id')} onDocs={() => navigate('docs')} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      {/* Global CRT atmosphere */}
      <CRTScanlines opacity={0.03} />
      <PhosphorVignette />

      <ChaosNav activePage={page} onNavigate={navigate} />
      {page === 'id' && <ChaosIDPage sharedAddress={sharedAddress} />}
      {page === 'board' && <ChaosBoardPage />}
      {page === 'market' && <ChaosMarketPage />}
      {page === 'bridge' && <BridgePage />}
      {page === 'docs' && <DocsPage />}
    </div>
  )
}

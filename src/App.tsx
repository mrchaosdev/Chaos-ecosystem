import { useState } from 'react'
import { ChaosNav } from '@/components/ChaosNav'
import { ChaosIDPage } from '@/components/ChaosIDPage'
import { ChaosBoardPage } from '@/components/ChaosBoardPage'
import { ChaosMarketPage } from '@/components/ChaosMarketPage'
import { LandingPage } from '@/components/LandingPage'
import { BridgePage } from '@/components/BridgePage'
import { CRTScanlines, PhosphorVignette } from '@/components/CRTOverlay'
import type { Page } from '@/types'

// Detect profile-share URL at init time (no effect needed)
function getInitialState(): { showLanding: boolean; page: Page; sharedAddress: string | null } {
  const match = window.location.pathname.match(/^\/id\/(0x[0-9a-fA-F]{40})$/)
  if (match) return { showLanding: false, page: 'id', sharedAddress: match[1] }
  return { showLanding: true, page: 'id', sharedAddress: null }
}

const INITIAL = getInitialState()

export default function App() {
  const [showLanding, setShowLanding] = useState(INITIAL.showLanding)
  const [page, setPage] = useState<Page>(INITIAL.page)

  if (showLanding) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a]">
        <CRTScanlines opacity={0.03} />
        <PhosphorVignette />
        <LandingPage onEnter={() => setShowLanding(false)} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      {/* Global CRT atmosphere */}
      <CRTScanlines opacity={0.03} />
      <PhosphorVignette />

      <ChaosNav activePage={page} onNavigate={setPage} />
      {page === 'id' && <ChaosIDPage sharedAddress={INITIAL.sharedAddress} />}
      {page === 'board' && <ChaosBoardPage />}
      {page === 'market' && <ChaosMarketPage />}
      {page === 'bridge' && <BridgePage />}
    </div>
  )
}

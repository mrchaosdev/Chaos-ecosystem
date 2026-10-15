import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { NetworkArc } from '@web3icons/react'
import { ArrowUpRight } from 'lucide-react'
import { type Page } from '@/types'
import { FaucetButton } from '@/components/FaucetButton'
import { LanguagePicker } from '@/components/LanguagePicker'
import { useLocale } from '@/i18n/LocaleProvider'

interface ChaosNavProps {
  activePage: Page
  onNavigate: (page: Page) => void
}

const NAV_ITEMS: { id: Page; key: string }[] = [
  { id: 'id', key: 'nav.id' },
  { id: 'board', key: 'nav.board' },
  { id: 'market', key: 'nav.market' },
  { id: 'bridge', key: 'nav.bridge' },
  { id: 'docs', key: 'nav.docs' },
]

export function ChaosNav({ activePage, onNavigate }: ChaosNavProps) {
  const { isConnected, address } = useAccount()
  const { locale, t } = useLocale()
  const chaosPayUrl = address
    ? `https://chaospayment.xyz/${locale}/?ecosystemWallet=${encodeURIComponent(address)}`
    : `https://chaospayment.xyz/${locale}/`

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo + Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('id')}
            className="font-mono text-sm font-bold tracking-[0.12em] text-white select-none"
          >
            CHAOS<span className="text-[#ff4d00]">//</span>
          </button>
          <nav className="hidden sm:flex items-center gap-0 border-l border-white/[0.06] pl-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={[
                  'font-mono text-[11px] tracking-[0.14em] px-4 py-4 relative transition-colors',
                  activePage === item.id
                    ? 'text-white'
                    : 'text-white/25 hover:text-white/60',
                ].join(' ')}
              >
                {t(item.key)}
                {activePage === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff4d00]" />
                )}
              </button>
            ))}
            <a
              href={chaosPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={address ? `Open ChaosPay with ${address} as wallet context` : 'Open ChaosPay; connect your wallet there if prompted'}
              className="font-mono text-[11px] tracking-[0.14em] px-4 py-4 text-white/25 transition-colors hover:text-white/60"
            >
              {t('nav.pay')} <ArrowUpRight className="inline size-3" />
            </a>
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] tracking-[0.15em] text-white/20">
            <NetworkArc size={11} variant="mono" />
            <span>{t('nav.arc')}</span>
            {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </div>
          <FaucetButton compact />
          <LanguagePicker compact />
          <ConnectKitButton.Custom>
            {({ isConnected, show, address }) => (
              <button
                onClick={show}
                className="font-mono text-[10px] tracking-[0.14em] px-4 py-2 border border-white/[0.12] text-white/50 hover:border-[#ff4d00]/60 hover:text-white transition-colors"
              >
                {isConnected ? `${address?.slice(0, 6)}…${address?.slice(-4)}` : t('nav.connect')}
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="sm:hidden flex border-t border-white/[0.05]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={[
              'flex-1 font-mono text-[10px] tracking-[0.14em] py-2.5 text-center transition-colors relative',
              activePage === item.id ? 'text-white' : 'text-white/25',
            ].join(' ')}
          >
            {t(item.key)}
            {activePage === item.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#ff4d00]" />
            )}
          </button>
        ))}
        <a
          href={chaosPayUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ChaosPay"
          title={address ? `Open ChaosPay with ${address} as wallet context` : 'Open ChaosPay; connect your wallet there if prompted'}
          className="flex-1 font-mono text-[10px] tracking-[0.14em] py-2.5 text-center text-white/25 transition-colors hover:text-white/60"
        >
          {t('nav.payShort')} <ArrowUpRight className="inline size-3" />
        </a>
      </div>
    </header>
  )
}

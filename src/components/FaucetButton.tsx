import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, ExternalLink, X, Copy, Check } from 'lucide-react'
import { useAccount } from 'wagmi'

const ARC_FAUCET_URL = 'https://faucet.circle.com'
const ARC_TESTNET_CHAIN_ID = 5042002

const FAUCET_SOURCES = [
  {
    name: 'CIRCLE FAUCET',
    url: 'https://faucet.circle.com',
    description: 'Official Circle testnet faucet — USDC on Arc Testnet, ETH Sepolia, Base Sepolia and more.',
    chains: ['Arc Testnet', 'ETH Sepolia', 'Base Sepolia', 'Polygon Amoy'],
    accent: '#ff4d00',
  },
  {
    name: 'ARC STUDIO SIDEBAR',
    url: null,
    description: 'Use the "Get test USDC" button in the Arc Studio sidebar (bottom left) to drip USDC directly to your wallet.',
    chains: ['Arc Testnet'],
    accent: '#00e5ff',
  },
]

interface FaucetButtonProps {
  compact?: boolean
}

export function FaucetButton({ compact = false }: FaucetButtonProps) {
  const { address, chainId } = useAccount()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isWrongChain = !!address && chainId !== ARC_TESTNET_CHAIN_ID

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`flex items-center gap-2 font-mono tracking-widest transition-all
          ${compact
            ? 'text-[9px] text-white/25 hover:text-[#00e5ff] py-1'
            : 'text-[10px] px-4 py-2 border border-[#00e5ff]/20 text-[#00e5ff]/60 hover:text-[#00e5ff] hover:border-[#00e5ff]/40 hover:bg-[#00e5ff]/5'
          }`}>
        <Droplets size={compact ? 10 : 12} />
        {compact ? 'GET TEST USDC' : 'GET TEST USDC'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/[0.1]"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.22em] text-white/20 mb-1">CHAOS ECOSYSTEM</p>
                  <h2 className="font-mono text-lg font-bold flex items-center gap-2">
                    <Droplets size={16} className="text-[#00e5ff]" />
                    GET TEST USDC
                  </h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/60 transition-colors p-1 -mr-1">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">

                {/* Your address */}
                {address ? (
                  <div className="bg-[#0a0a0a] border border-white/[0.06] p-4">
                    <p className="font-mono text-[9px] tracking-widest text-white/20 mb-2">YOUR WALLET</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] text-white/50 break-all leading-relaxed">{address}</p>
                      <button onClick={handleCopy}
                        className="shrink-0 text-white/20 hover:text-[#00e5ff] transition-colors">
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                    {isWrongChain && (
                      <p className="font-mono text-[9px] text-[#ff4d00]/60 mt-2">
                        Switch to Arc Testnet after funding to use the app.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0a0a0a] border border-white/[0.06] p-4">
                    <p className="font-mono text-[10px] text-white/20">Connect wallet first to see your address.</p>
                  </div>
                )}

                {/* Faucet sources */}
                <div className="space-y-2">
                  {FAUCET_SOURCES.map(src => (
                    <div key={src.name} className="border border-white/[0.06] p-4"
                      style={{ borderLeftColor: src.accent, borderLeftWidth: 2 }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-mono text-[10px] font-bold tracking-widest" style={{ color: src.accent }}>
                          {src.name}
                        </p>
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 font-mono text-[9px] tracking-widest text-white/20 hover:text-white transition-colors">
                            OPEN <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                      <p className="font-mono text-[9px] text-white/30 leading-relaxed mb-2">{src.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {src.chains.map(c => (
                          <span key={c} className="font-mono text-[8px] tracking-wider px-1.5 py-0.5 bg-white/[0.04] text-white/20">{c}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick instructions */}
                <div className="bg-[#0a0a0a] border border-white/[0.04] p-4">
                  <p className="font-mono text-[9px] tracking-widest text-white/20 mb-3">QUICK STEPS</p>
                  {[
                    'Connect wallet above',
                    'Copy your address',
                    'Go to Circle Faucet → select Arc Testnet → paste address → request',
                    'Wait ~10s, then refresh balance in the ID page',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                      <span className="font-mono text-[9px] text-[#ff4d00] shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="font-mono text-[9px] text-white/30 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="p-5 pt-0">
                <a href={ARC_FAUCET_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 font-mono text-[11px] tracking-[0.15em] font-bold transition-all hover:opacity-80"
                  style={{ background: '#00e5ff', color: '#000' }}>
                  <Droplets size={13} /> OPEN CIRCLE FAUCET →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

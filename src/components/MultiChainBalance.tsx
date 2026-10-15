import { useState, useEffect, useCallback, useRef } from 'react'
import { createPublicClient, http, erc20Abi } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { TESTNET_ONCHAIN_CHAINS } from '@/onchain-facts'

// Testnet chains that have USDC
const MULTICHAIN_TARGETS = TESTNET_ONCHAIN_CHAINS.filter(c => c.usdc).map(c => ({
  chainId: c.chainId,
  name: c.name,
  explorerBase: c.explorerBase,
  rpcUrl: c.rpcUrls[0],
  usdcAddress: c.usdc!.address as `0x${string}`,
  decimals: c.usdc!.decimals,
}))

// Short label per chain
const CHAIN_LABEL: Record<number, string> = {
  5042002: 'ARC',
  11155111: 'ETH',
  84532: 'BASE',
  421614: 'ARB',
  43113: 'AVAX',
  80002: 'POL',
  11155420: 'OP',
  1301: 'UNI',
  1328: 'SEI',
}

// Accent color per chain
const CHAIN_COLOR: Record<number, string> = {
  5042002: '#ff4d00',
  11155111: '#627eea',
  84532: '#0052ff',
  421614: '#28a0f0',
  43113: '#e84142',
  80002: '#8247e5',
  11155420: '#ff0420',
  1301: '#ff007a',
  1328: '#9d1ef7',
}

interface ChainBalance {
  chainId: number
  balance: bigint | null
  loading: boolean
  error: boolean
}

async function fetchBalance(rpcUrl: string, usdcAddress: `0x${string}`, account: `0x${string}`): Promise<bigint> {
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 8000 }) })
  return client.readContract({ address: usdcAddress, abi: erc20Abi, functionName: 'balanceOf', args: [account] })
}

function formatUsdc(raw: bigint, decimals: number): string {
  const n = Number(raw) / 10 ** decimals
  if (n === 0) return '0.00'
  if (n < 0.01) return '<0.01'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function MultiChainBalance({ address }: { address: `0x${string}` }) {
  const [balances, setBalances] = useState<ChainBalance[]>(
    MULTICHAIN_TARGETS.map(c => ({ chainId: c.chainId, balance: null, loading: true, error: false }))
  )
  const [lastRefreshSec, setLastRefreshSec] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startedRef = useRef(false)

  const fetchAll = useCallback(() => {
    setIsRefreshing(true)
    setLastRefreshSec(0)
    setBalances(MULTICHAIN_TARGETS.map(c => ({ chainId: c.chainId, balance: null, loading: true, error: false })))

    const results: ChainBalance[] = MULTICHAIN_TARGETS.map(c => ({ chainId: c.chainId, balance: null, loading: true, error: false }))
    let remaining = MULTICHAIN_TARGETS.length
    const startedAt = performance.now()

    const finish = () => {
      remaining -= 1
      setBalances([...results])
      if (remaining === 0) {
        setLastRefreshSec(Math.round((performance.now() - startedAt) / 1000))
        setIsRefreshing(false)
      }
    }

    MULTICHAIN_TARGETS.forEach((target, i) => {
      fetchBalance(target.rpcUrl, target.usdcAddress, address)
        .then(balance => {
          results[i] = { chainId: target.chainId, balance, loading: false, error: false }
          finish()
        })
        .catch(() => {
          results[i] = { chainId: target.chainId, balance: null, loading: false, error: true }
          finish()
        })
    })
  }, [address])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    fetchAll()
  }, [fetchAll])

  // Total across all chains (only successful reads)
  const total = balances.reduce((sum, b, i) => {
    if (b.balance === null) return sum
    const target = MULTICHAIN_TARGETS[i]
    if (!target) return sum
    return sum + Number(b.balance) / 10 ** target.decimals
  }, 0)

  const nonZero = balances.filter((b, i) => {
    const target = MULTICHAIN_TARGETS[i]
    return b.balance !== null && b.balance > 0n && target
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.22em] text-white/20">// USDC ACROSS CHAINS</span>
          <span className="font-mono text-[9px] text-white/10">
            ({MULTICHAIN_TARGETS.length} testnets)
          </span>
        </div>
        <button onClick={() => { void fetchAll() }} disabled={isRefreshing}
          className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-white/20 hover:text-white/50 transition-colors disabled:opacity-30">
          <RefreshCw size={9} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'LOADING…' : lastRefreshSec > 0 ? `LOADED IN ${lastRefreshSec}s` : 'REFRESH'}
        </button>
      </div>

      {/* Total bar */}
      {total > 0 && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3.5 border border-[#ff4d00]/15 bg-[#ff4d00]/[0.03] flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.22em] text-white/25">TOTAL USDC</span>
          <span className="font-mono font-bold tabular-nums" style={{ fontSize: '1.4rem', letterSpacing: '-0.02em', color: '#ff4d00' }}>
            {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-white/20 ml-1.5 font-normal">USDC</span>
          </span>
        </motion.div>
      )}

      {/* Chain grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {MULTICHAIN_TARGETS.map((target, i) => {
          const b = balances[i]
          if (!b) return null
          const color = CHAIN_COLOR[target.chainId] ?? '#ffffff'
          const label = CHAIN_LABEL[target.chainId] ?? target.name.slice(0, 6).toUpperCase()
          const isNonZero = b.balance !== null && b.balance > 0n

          return (
            <motion.div key={target.chainId}
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border p-3 relative overflow-hidden group"
              style={{ borderColor: isNonZero ? `${color}25` : 'rgba(255,255,255,0.04)', background: isNonZero ? `${color}05` : '#0c0c0c' }}>

              {/* Glow on nonzero */}
              {isNonZero && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}10 0%, transparent 70%)` }} />
              )}

              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: isNonZero ? color : 'rgba(255,255,255,0.15)' }}>
                  {label}
                </span>
                <a href={`${target.explorerBase}/address/${address}`} target="_blank" rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={8} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </a>
              </div>

              <AnimatePresence mode="wait">
                {b.loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-5 w-12 bg-white/[0.04] animate-pulse" />
                ) : b.error ? (
                  <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="font-mono text-[9px] text-white/15">—</motion.p>
                ) : (
                  <motion.p key="val" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                    className="font-mono font-bold tabular-nums leading-none"
                    style={{ fontSize: '1.1rem', letterSpacing: '-0.02em', color: isNonZero ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)' }}>
                    {b.balance !== null ? formatUsdc(b.balance, target.decimals) : '—'}
                    <span className="text-[8px] text-white/20 ml-1 font-normal">USDC</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Non-zero callout */}
      <AnimatePresence>
        {nonZero.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-2 font-mono text-[9px] text-white/15 tracking-wider">
            USDC FOUND ON {nonZero.length} CHAIN{nonZero.length > 1 ? 'S' : ''}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

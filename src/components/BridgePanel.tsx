import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useSwitchChain } from 'wagmi'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { AppKit } from '@circle-fin/app-kit'
import type { EIP1193Provider } from 'viem'
import { ArrowRight, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react'
import { TESTNET_ONCHAIN_CHAINS } from '@/onchain-facts'

// Chain name map: chainId → AppKit chain string
const CHAIN_NAME: Record<number, string> = {
  5042002: 'Arc_Testnet',
  11155111: 'Ethereum_Sepolia',
  84532: 'Base_Sepolia',
  421614: 'Arbitrum_Sepolia',
  43113: 'Avalanche_Fuji',
  80002: 'Polygon_Amoy',
  11155420: 'OP_Sepolia',
}

// Only testnet chains with USDC + CCTP support
const BRIDGE_CHAINS = TESTNET_ONCHAIN_CHAINS.filter(
  c => c.usdc && CHAIN_NAME[c.chainId]
)

const appKit = new AppKit()

type BridgeStep = 'approve' | 'burn' | 'fetchAttestation' | 'mint'
type StepState = 'pending' | 'active' | 'success' | 'error'

interface StepStatus { name: BridgeStep; state: StepState; txHash?: string; explorerUrl?: string }

const STEP_LABELS: Record<BridgeStep, string> = {
  approve: 'APPROVE',
  burn: 'BURN',
  fetchAttestation: 'ATTEST',
  mint: 'MINT',
}

function StepRow({ step }: { step: StepStatus }) {
  const colors: Record<StepState, string> = {
    pending: 'rgba(255,255,255,0.12)',
    active: '#ff4d00',
    success: '#4ade80',
    error: '#f87171',
  }
  const color = colors[step.state]
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-14 shrink-0">
        <span className="font-mono text-[9px] tracking-[0.18em]" style={{ color }}>
          {STEP_LABELS[step.name]}
        </span>
      </div>
      <div className="flex-1 h-px" style={{ background: color, opacity: step.state === 'pending' ? 0.15 : 0.6 }} />
      {step.state === 'active' && <Loader2 size={10} className="text-[#ff4d00] animate-spin shrink-0" />}
      {step.state === 'success' && <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />}
      {step.state === 'error' && <XCircle size={10} className="text-red-400 shrink-0" />}
      {step.txHash && step.explorerUrl && (
        <a href={step.explorerUrl} target="_blank" rel="noopener noreferrer"
          className="font-mono text-[9px] text-white/20 hover:text-white/60 transition-colors flex items-center gap-1 shrink-0">
          TX <ExternalLink size={8} />
        </a>
      )}
    </div>
  )
}

export function BridgePanel() {
  const { connector, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()

  const [fromChainId, setFromChainId] = useState(11155111) // ETH Sepolia default
  const [toChainId, setToChainId] = useState(5042002)     // Arc Testnet default
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'bridging' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [steps, setSteps] = useState<StepStatus[]>([])

  const fromChain = BRIDGE_CHAINS.find(c => c.chainId === fromChainId)
  const toChain = BRIDGE_CHAINS.find(c => c.chainId === toChainId)

  const swap = () => {
    setFromChainId(toChainId)
    setToChainId(fromChainId)
  }

  const handleBridge = useCallback(async () => {
    if (!connector || !fromChain || !toChain || !amount || Number(amount) <= 0) return
    const fromName = CHAIN_NAME[fromChainId]
    const toName = CHAIN_NAME[toChainId]
    if (!fromName || !toName) return

    setStatus('bridging')
    setErrorMsg('')
    setSteps([
      { name: 'approve', state: 'pending' },
      { name: 'burn', state: 'pending' },
      { name: 'fetchAttestation', state: 'pending' },
      { name: 'mint', state: 'pending' },
    ])

    try {
      if (chainId !== fromChainId) {
        await switchChainAsync({ chainId: fromChainId })
      }

      const provider = (await connector.getProvider()) as EIP1193Provider
      const adapter = await createViemAdapterFromProvider({ provider })

      // Animate steps as active while bridging
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, state: 'active' } : s))

      // AppKit chain param uses a branded string type; cast through unknown
      const result = await appKit.bridge({
        from: { adapter, chain: fromName as unknown as Parameters<typeof appKit.bridge>[0]['from']['chain'] },
        to: { adapter, chain: toName as unknown as Parameters<typeof appKit.bridge>[0]['to']['chain'] },
        amount,
      })

      // Update steps from result
      const stepNames: BridgeStep[] = ['approve', 'burn', 'fetchAttestation', 'mint']
      const resultSteps = (result.steps ?? []) as Array<{ name: string; state: string; txHash?: string; explorerUrl?: string }>
      setSteps(stepNames.map(name => {
        const found = resultSteps.find(s => s.name === name)
        return {
          name,
          state: found ? (found.state === 'success' ? 'success' : found.state === 'error' ? 'error' : 'pending') : 'pending',
          txHash: found?.txHash,
          explorerUrl: found?.explorerUrl,
        }
      }))

      if (result.state === 'success') {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(`Bridge ended with state: ${result.state}`)
      }
    } catch (e: unknown) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message.slice(0, 160) : 'Unknown error')
      setSteps(prev => prev.map(s => s.state === 'active' ? { ...s, state: 'error' } : s))
    }
  }, [connector, fromChainId, toChainId, fromChain, toChain, amount, chainId, switchChainAsync])

  const canBridge = isConnected && !!amount && Number(amount) > 0 && fromChainId !== toChainId

  return (
    <div className="border border-white/[0.06] bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div>
          <p className="font-mono text-[9px] tracking-[0.22em] text-white/20 mb-0.5">CHAOS ECOSYSTEM</p>
          <h2 className="font-mono text-sm font-bold tracking-tight">CHAOS<span style={{ color: '#ff4d00' }}>//</span>BRIDGE</h2>
        </div>
        <span className="font-mono text-[9px] tracking-widest text-white/15 border border-white/[0.06] px-2.5 py-1">
          CCTP V2 · TESTNET
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* From → To */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="font-mono text-[9px] tracking-[0.2em] text-white/20 block mb-1.5">FROM</label>
            <select value={fromChainId} onChange={e => setFromChainId(Number(e.target.value))}
              className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-[#ff4d00]/40 transition-colors appearance-none">
              {BRIDGE_CHAINS.filter(c => c.chainId !== toChainId).map(c => (
                <option key={c.chainId} value={c.chainId}>{c.name}</option>
              ))}
            </select>
          </div>

          <button onClick={swap} className="mt-5 p-2 border border-white/[0.08] text-white/25 hover:text-[#ff4d00] hover:border-[#ff4d00]/30 transition-colors">
            <ArrowRight size={12} />
          </button>

          <div className="flex-1">
            <label className="font-mono text-[9px] tracking-[0.2em] text-white/20 block mb-1.5">TO</label>
            <select value={toChainId} onChange={e => setToChainId(Number(e.target.value))}
              className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-[#ff4d00]/40 transition-colors appearance-none">
              {BRIDGE_CHAINS.filter(c => c.chainId !== fromChainId).map(c => (
                <option key={c.chainId} value={c.chainId}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="font-mono text-[9px] tracking-[0.2em] text-white/20 block mb-1.5">AMOUNT (USDC)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#ff4d00]/40 transition-colors" />
        </div>

        {/* Route summary */}
        {fromChain && toChain && amount && Number(amount) > 0 && (
          <div className="p-3.5 bg-[#0a0a0a] border border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[9px] text-white/30">
              <span>{fromChain.name}</span>
              <ArrowRight size={9} />
              <span>{toChain.name}</span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {amount} <span className="text-white/25 font-normal text-[10px]">USDC</span>
            </span>
          </div>
        )}

        {/* Bridge steps progress */}
        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border border-white/[0.05] px-4 py-3 overflow-hidden">
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-2">TRANSFER PROGRESS</p>
              {steps.map(s => <StepRow key={s.name} step={s} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {status === 'error' && errorMsg && (
          <div className="flex items-start gap-2 p-3 border border-red-500/20 bg-red-500/5">
            <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[10px] text-red-400 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 border border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle2 size={11} className="text-emerald-400" />
            <p className="font-mono text-[10px] text-emerald-400 tracking-wider">BRIDGE COMPLETE — USDC arrived on {toChain?.name}</p>
          </div>
        )}

        {/* CTA */}
        {!isConnected ? (
          <div className="font-mono text-[10px] tracking-[0.14em] py-3.5 text-center border border-white/[0.07] text-white/20">
            CONNECT WALLET TO BRIDGE
          </div>
        ) : (
          <button onClick={() => { void handleBridge() }}
            disabled={!canBridge || status === 'bridging'}
            className="w-full font-mono text-[11px] tracking-[0.15em] py-3.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
            {status === 'bridging'
              ? <><Loader2 size={12} className="animate-spin" /> BRIDGING…</>
              : status === 'success'
                ? '← BRIDGE AGAIN'
                : 'BRIDGE USDC →'}
          </button>
        )}

        <p className="font-mono text-[9px] text-white/15 text-center">
          Powered by Circle CCTP V2 · ~8-20 sec transfer time
        </p>
      </div>
    </div>
  )
}

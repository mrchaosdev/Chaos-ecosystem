import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, parseUnits, formatUnits } from 'viem'
import { gsap } from 'gsap'
import { Plus, Clock, User, X, Lock, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { TiltCard, MagneticButton } from '@/components/MagneticButton'

import { toast } from 'sonner'

const BOARD_ADDRESS = '0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7' as const
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
const ARC_TESTNET_ID = 5042002

const BOARD_ABI = [
  { name: 'bountyCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getBounty', type: 'function', stateMutability: 'view', inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [{ components: [{ name: 'poster', type: 'address' }, { name: 'claimer', type: 'address' }, { name: 'reward', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' }], name: '', type: 'tuple' }] },
  { name: 'postBounty', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'reward', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], outputs: [{ name: 'bountyId', type: 'uint256' }] },
  { name: 'claimBounty', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [] },
  { name: 'submitWork', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [] },
  { name: 'approveBounty', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [] },
  { name: 'cancelBounty', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'bountyId', type: 'uint256' }], outputs: [] },
] as const

const STATUS_LABELS = ['OPEN', 'CLAIMED', 'SUBMITTED', 'COMPLETED', 'CANCELLED']
const STATUS_COLORS: Record<number, string> = {
  0: '#ff4d00', 1: '#ffd700', 2: '#00e5ff', 3: '#4ade80', 4: 'rgba(255,255,255,0.2)',
}

function formatDeadline(ts: bigint): string {
  if (ts === 0n) return 'No deadline'
  const diff = Number(ts) - Math.floor(Date.now() / 1000)
  if (diff <= 0) return 'Expired'
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  return d > 0 ? `${d}d left` : `${h}h left`
}

function formatAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function InputField({ label, value, onChange, placeholder, type = 'text', rows }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; rows?: number
}) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.2em] text-white/25 block mb-1.5">{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#ff4d00]/40 transition-colors resize-none" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
          className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#ff4d00]/40 transition-colors" />
      )}
    </div>
  )
}

function PostModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [days, setDays] = useState('7')
  const [step, setStep] = useState<'form' | 'approve' | 'post'>('form')

  const rewardWei = reward ? parseUnits(reward, 6) : 0n
  const getDeadline = () => BigInt(Math.floor(Date.now() / 1000) + Number(days) * 86400)

  const { writeContract: approve, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract()
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: post, data: postHash, isPending: postPending, error: postError } = useWriteContract()
  const { isSuccess: postSuccess } = useWaitForTransactionReceipt({ hash: postHash })

  useEffect(() => {
    if (approveSuccess && step === 'approve') setTimeout(() => setStep('post'), 0)
  }, [approveSuccess, step])
  useEffect(() => {
    if (postSuccess) setTimeout(() => { toast.success('Bounty posted!'); onPosted(); onClose() }, 0)
  }, [postSuccess, onPosted, onClose])

  const handleApprove = () => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    setStep('approve')
    approve({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [BOARD_ADDRESS, rewardWei] })
  }

  const txError = approveError ?? postError
  const canSubmit = !!title.trim() && !!reward && Number(reward) > 0 && !!address

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/[0.1] p-6 sm:p-7"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] text-white/20 mb-1">CHAOS BOARD</p>
            <h2 className="font-mono text-xl font-bold tracking-tight">POST BOUNTY</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/70 transition-colors p-1 -mr-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <InputField label="TITLE *" value={title} onChange={setTitle} placeholder="Build a landing page, design a logo..." />
          <InputField label="DESCRIPTION" value={description} onChange={setDescription} rows={3} placeholder="Describe the task in detail..." />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="REWARD (USDC) *" value={reward} onChange={setReward} placeholder="50" type="number" />
            <InputField label="DEADLINE (DAYS)" value={days} onChange={setDays} type="number" />
          </div>
        </div>

        {reward && Number(reward) > 0 && (
          <div className="mt-4 p-3.5 bg-[#0a0a0a] border border-white/[0.06] flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/25">LOCKING IN ESCROW</p>
              <p className="font-mono text-[9px] tracking-wider text-white/15 mt-0.5">2-step: approve → post</p>
            </div>
            <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: '#ff4d00' }}>
              {reward}<span className="text-xs text-white/30 ml-1">USDC</span>
            </span>
          </div>
        )}

        {/* Error */}
        {txError && step !== 'form' && (
          <div className="mt-3 flex items-start gap-2 p-3 border border-red-500/20 bg-red-500/5">
            <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[10px] text-red-400 leading-relaxed">
              {txError.message.slice(0, 140)}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-2">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-3">
            {['APPROVE', 'POST'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-5 h-5 flex items-center justify-center border font-mono text-[9px]"
                  style={{ borderColor: (i === 0 && (step === 'approve' || step === 'post')) || (i === 1 && step === 'post') ? '#ff4d00' : 'rgba(255,255,255,0.1)', color: (i === 0 && (step === 'approve' || step === 'post')) || (i === 1 && step === 'post') ? '#ff4d00' : 'rgba(255,255,255,0.2)' }}>
                  {((i === 0 && step === 'post') || (i === 1 && step === 'post' && false)) ? '✓' : i + 1}
                </div>
                <span className="font-mono text-[9px] text-white/25 tracking-widest">{s}</span>
                {i === 0 && <span className="font-mono text-[9px] text-white/10 mx-1">→</span>}
              </div>
            ))}
          </div>

          {step === 'form' && (
            <button onClick={handleApprove} disabled={!canSubmit}
              className="w-full font-mono text-[11px] tracking-[0.15em] py-3.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
              1 / 2 — APPROVE USDC →
            </button>
          )}
          {step === 'approve' && (
            <div className="w-full font-mono text-[11px] tracking-[0.15em] py-3.5 text-center border border-white/[0.08]"
              style={{ color: approvePending ? '#ff4d00' : 'rgba(255,255,255,0.3)' }}>
              {approvePending ? 'SIGN IN WALLET…' : 'CONFIRMING APPROVAL…'}
            </div>
          )}
          {step === 'post' && (
            <button onClick={() => post({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'postBounty', args: [title, description, rewardWei, getDeadline()] })}
              disabled={postPending}
              className="w-full font-mono text-[11px] tracking-[0.15em] py-3.5 transition-all disabled:opacity-30"
              style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
              {postPending ? 'SIGN IN WALLET…' : '2 / 2 — POST BOUNTY →'}
            </button>
          )}
          {/* retry on error */}
          {txError && step !== 'form' && (
            <button onClick={() => setStep('form')} className="w-full font-mono text-[10px] tracking-widest py-2.5 border border-white/10 text-white/30 hover:text-white/60 transition-colors">
              ← START OVER
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

interface BountyCardProps { id: number; filterStatus: number | null; onAction: () => void }

function BountyCard({ id, filterStatus, onAction }: BountyCardProps) {
  const { address } = useAccount()
  const cardRef = useRef<HTMLDivElement>(null)

  const { data: bounty } = useReadContract({
    address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'getBounty',
    args: [BigInt(id)], chainId: ARC_TESTNET_ID,
  })

  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isSuccess) setTimeout(() => { toast.success('Done!'); onAction() }, 0)
  }, [isSuccess, onAction])

  useEffect(() => {
    if (!cardRef.current) return
    const el = cardRef.current
    const enter = () => { gsap.to(el, { borderColor: 'rgba(255,77,0,0.2)', duration: 0.18 }) }
    const leave = () => { gsap.to(el, { borderColor: 'rgba(255,255,255,0.05)', duration: 0.28 }) }
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    return () => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave) }
  }, [])

  if (!bounty) return null
  const { poster, claimer, reward, deadline, status, title, description } = bounty

  // Filter: hide cancelled always; hide if status doesn't match filter
  if (status === 4) return null
  if (filterStatus !== null && status !== filterStatus) return null

  const isPoster = address?.toLowerCase() === poster.toLowerCase()
  const isClaimer = address?.toLowerCase() === claimer.toLowerCase()
  const statusColor = STATUS_COLORS[status] ?? 'rgba(255,255,255,0.2)'

  const actionLabel = (): string | null => {
    if (status === 0 && !isPoster) return 'CLAIM →'
    if (status === 1 && isClaimer) return 'SUBMIT WORK →'
    if (status === 2 && isPoster) return 'RELEASE FUNDS →'
    if (status === 0 && isPoster) return 'CANCEL'
    return null
  }

  const handleAction = () => {
    if (status === 0 && !isPoster) writeContract({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'claimBounty', args: [BigInt(id)] })
    else if (status === 1 && isClaimer) writeContract({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'submitWork', args: [BigInt(id)] })
    else if (status === 2 && isPoster) writeContract({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'approveBounty', args: [BigInt(id)] })
    else if (status === 0 && isPoster) writeContract({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'cancelBounty', args: [BigInt(id)] })
  }

  const label = actionLabel()

  return (
    <TiltCard className="border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0d0d0d' }} intensity={3}>
      <motion.div ref={cardRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(id * 0.03, 0.25) }} className="p-5">

        {/* Top: meta + reward */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
              <span className="font-mono text-[9px] tracking-[0.18em] text-white/20">#{String(id).padStart(4, '0')}</span>
              <span className="w-px h-2.5 bg-white/10 hidden sm:block" />
              <span className="font-mono text-[9px] tracking-[0.18em] font-semibold" style={{ color: statusColor }}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            <h3 className="font-semibold text-white text-[15px] leading-snug">{title}</h3>
            {description && (
              <p className="text-white/30 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">{description}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[1.6rem] font-bold tabular-nums leading-none" style={{ color: statusColor, letterSpacing: '-0.02em' }}>
              {formatUnits(reward, 6)}
            </p>
            <p className="font-mono text-[9px] tracking-widest text-white/20 mt-0.5">USDC</p>
          </div>
        </div>

        {/* Bottom: meta row + action */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.04]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-white/20">
              <Lock size={8} /> LOCKED
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-white/20">
              <Clock size={8} /> {formatDeadline(deadline)}
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-white/20">
              <User size={8} /> {formatAddr(poster)}
            </span>
          </div>
          {label && (
            <button onClick={handleAction} disabled={isPending}
              className="font-mono text-[10px] tracking-[0.14em] px-3 py-1.5 border transition-all disabled:opacity-30"
              style={{ color: statusColor, borderColor: `${statusColor}30` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${statusColor}12` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              {isPending ? '…' : label}
            </button>
          )}
        </div>

        {/* Inline tx error */}
        {txError && (
          <div className="mt-3 flex items-start gap-2 p-2.5 border border-red-500/15 bg-red-500/5">
            <XCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[9px] text-red-400 leading-relaxed">{txError.message.slice(0, 100)}</p>
          </div>
        )}
        {isSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 border border-emerald-500/15 bg-emerald-500/5">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <p className="font-mono text-[9px] text-emerald-400 tracking-wider">TRANSACTION CONFIRMED</p>
          </div>
        )}
      </motion.div>
    </TiltCard>
  )
}

export function ChaosBoardPage() {
  const [showPost, setShowPost] = useState(false)
  const [filter, setFilter] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { address, chainId } = useAccount()
  const countRef = useRef<HTMLSpanElement>(null)
  const wrongChain = address && chainId !== ARC_TESTNET_ID

  const { data: bountyCount, refetch } = useReadContract({
    address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'bountyCount', chainId: ARC_TESTNET_ID,
  })
  const count = bountyCount ? Number(bountyCount) : 0

  useEffect(() => {
    if (countRef.current && count > 0) {
      gsap.from(countRef.current, { textContent: 0, duration: 1.2, snap: { textContent: 1 }, ease: 'power3.out' })
    }
  }, [count])

  const handleRefresh = () => { setRefreshKey(k => k + 1); void refetch() }

  // Auto-poll every 15s when there are active bounties
  useEffect(() => {
    if (count === 0) return
    const id = setInterval(() => { void refetch() }, 15000)
    return () => clearInterval(id)
  }, [count, refetch])

  const filters = [
    { label: 'ALL', value: null },
    { label: 'OPEN', value: 0 },
    { label: 'CLAIMED', value: 1 },
    { label: 'SUBMITTED', value: 2 },
    { label: 'DONE', value: 3 },
  ]

  return (
    <div className="min-h-dvh bg-[#080808] text-white pt-14">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-wrap items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-[9px] tracking-[0.28em] text-white/20 mb-2">CHAOS ECOSYSTEM / BOUNTIES</p>
            <h1 className="font-mono font-black leading-none" style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', letterSpacing: '-0.03em' }}>
              CHAOS<span style={{ color: '#ff4d00' }}>//</span>BOARD
            </h1>
            <p className="font-mono text-[10px] text-white/20 tracking-widest mt-2">
              <span ref={countRef}>{count}</span> BOUNTIES · USDC LOCKED IN ESCROW
            </p>
          </motion.div>
          {address && (
            <MagneticButton onClick={() => setShowPost(true)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] px-5 py-3"
              style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
              <Plus size={12} /> POST BOUNTY
            </MagneticButton>
          )}
        </div>
      </div>

      {/* Wrong chain */}
      <AnimatePresence>
        {wrongChain && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-[#ff4d00]/10 border-b border-[#ff4d00]/20 overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <AlertTriangle size={12} className="text-[#ff4d00] shrink-0" />
              <p className="font-mono text-[10px] tracking-wider text-[#ff4d00]">WRONG NETWORK — switch to ARC TESTNET to post or interact</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {filters.map(f => (
            <button key={String(f.value)} onClick={() => setFilter(f.value)}
              className="font-mono text-[9px] tracking-[0.18em] px-3.5 py-1.5 border transition-all"
              style={{
                borderColor: filter === f.value ? '#ff4d00' : 'rgba(255,255,255,0.07)',
                color: filter === f.value ? '#ff4d00' : 'rgba(255,255,255,0.25)',
                background: filter === f.value ? 'rgba(255,77,0,0.06)' : 'transparent',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {count === 0 ? (
          <div className="text-center py-24 border border-white/[0.04]">
            <p className="font-mono text-xs text-white/15 tracking-widest">NO BOUNTIES YET</p>
            {address && <p className="font-mono text-[10px] text-white/10 mt-3">Post the first bounty to get started.</p>}
            {!address && <p className="font-mono text-[10px] text-white/10 mt-3">Connect wallet to post a bounty.</p>}
          </div>
        ) : (
          <div className="space-y-2.5" key={refreshKey}>
            {Array.from({ length: count }, (_, i) => count - 1 - i).map(i => (
              <BountyCard key={i} id={i} filterStatus={filter} onAction={handleRefresh} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPost && <PostModal onClose={() => setShowPost(false)} onPosted={handleRefresh} />}
      </AnimatePresence>
    </div>
  )
}

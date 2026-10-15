import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useSwitchChain } from 'wagmi'
import { erc20Abi, formatUnits } from 'viem'
import { gsap } from 'gsap'
import {
  ExternalLink, Search, AlertTriangle, CheckCircle2, XCircle,
  Zap, Shield, Activity, Copy, Check, ChevronRight, Wallet,
  ShoppingBag, ClipboardList, Share2
} from 'lucide-react'
import { buildTxExplorerUrl, requireChain } from '@/onchain-facts'
import { MultiChainBalance } from '@/components/MultiChainBalance'
import { useLocale } from '@/i18n/LocaleProvider'
import { AdminPanel } from '@/components/AdminPanel'
import type { ChaosProfile } from '@/types'

const CHAOS_ID_ADDRESS  = '0x763cba888b02b29e3bf631fb78de732e439f54a9' as const
const BOARD_ADDRESS     = '0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7' as const
const MARKET_ADDRESS    = '0x55203bc963be0731c8f013bc1de7f1fbb253b311' as const
const USDC_ADDRESS      = '0x3600000000000000000000000000000000000000' as const
const ARC_TESTNET_ID    = 5042002

const CHAOS_ID_ABI = [
  { name: 'register', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'getProfile', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'reputationScore', type: 'uint256' }, { name: 'txCount', type: 'uint256' },
      { name: 'volumeUsdc', type: 'uint256' }, { name: 'joinedAt', type: 'uint256' },
      { name: 'exists', type: 'bool' },
    ]}],
  },
] as const

const BOARD_ABI = [
  { name: 'bountyCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getBounty', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'bountyId', type: 'uint256' }],
    outputs: [{ components: [
      { name: 'poster', type: 'address' }, { name: 'claimer', type: 'address' },
      { name: 'reward', type: 'uint256' }, { name: 'deadline', type: 'uint256' },
      { name: 'status', type: 'uint8' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
    ], name: '', type: 'tuple' }],
  },
] as const

const MARKET_ABI = [
  { name: 'listingCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getListing', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [{ components: [
      { name: 'seller', type: 'address' }, { name: 'buyer', type: 'address' },
      { name: 'price', type: 'uint256' }, { name: 'status', type: 'uint8' },
      { name: 'title', type: 'string' }, { name: 'description', type: 'string' },
      { name: 'category', type: 'string' }, { name: 'disputeDeadline', type: 'uint256' },
    ], name: '', type: 'tuple' }],
  },
] as const

const BOUNTY_STATUS = ['OPEN', 'CLAIMED', 'SUBMITTED', 'COMPLETED', 'CANCELLED']
const LISTING_STATUS = ['ACTIVE', 'SOLD', 'DELIVERED', 'CONFIRMED', 'CANCELLED']
const BOUNTY_COLORS: Record<number, string> = { 0: '#ff4d00', 1: '#ffd700', 2: '#00e5ff', 3: '#4ade80', 4: '#ffffff20' }
const LISTING_COLORS: Record<number, string> = { 0: '#ff4d00', 1: '#ffd700', 2: '#00e5ff', 3: '#4ade80', 4: '#ffffff20' }

const TIERS = [
  { min: 0, max: 50, label: 'NEWCOMER', color: '#ff4d00' },
  { min: 50, max: 200, label: 'ACTIVE', color: '#ff8c00' },
  { min: 200, max: 500, label: 'TRUSTED', color: '#ffd700' },
  { min: 500, max: 9999, label: 'ELITE', color: '#00e5ff' },
]
function getTier(score: number) { return TIERS.find(t => score < t.max) ?? TIERS[TIERS.length - 1] }

function AnimatedNumber({ value, delay = 0, prefix = '', suffix = '' }: { value: number; delay?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const obj = { val: 0 }
    gsap.to(obj, { val: value, duration: 1.4, delay, ease: 'power3.out',
      onUpdate: () => { if (ref.current) ref.current.textContent = prefix + Math.round(obj.val).toString() + suffix }
    })
  }, [value, delay, prefix, suffix])
  return <span ref={ref}>{prefix}{value}{suffix}</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy} className="text-white/20 hover:text-white/60 transition-colors">
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  )
}

function ShareButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  const share = () => {
    const url = `${window.location.origin}/id/${address}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={share} className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-white/20 hover:text-[#ff4d00] transition-colors border border-white/[0.07] px-3 py-1.5">
      {copied ? <Check size={9} className="text-emerald-400" /> : <Share2 size={9} />}
      {copied ? 'COPIED!' : 'SHARE PROFILE'}
    </button>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="border border-white/[0.06] bg-[#0c0c0c]">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.05]">
        <span className="text-white/30">{icon}</span>
        <span className="font-mono text-[9px] tracking-[0.22em] text-white/30">{title}</span>
      </div>
      {children}
    </motion.div>
  )
}

// Single bounty row — only renders if user is involved
function BountyRow({ id, userAddress }: { id: number; userAddress: string }) {
  const { data } = useReadContract({
    address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'getBounty',
    args: [BigInt(id)], chainId: ARC_TESTNET_ID,
  })
  if (!data) return null
  const { poster, claimer, reward, status, title } = data
  const isPoster = poster.toLowerCase() === userAddress.toLowerCase()
  const isClaimer = claimer.toLowerCase() === userAddress.toLowerCase()
  if (!isPoster && !isClaimer) return null
  if (status === 4) return null // cancelled
  const color = BOUNTY_COLORS[status] ?? '#ffffff20'
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-white/70 truncate">{title}</p>
        <p className="font-mono text-[9px] text-white/25 mt-0.5 tracking-wider">
          {isPoster ? 'POSTED BY YOU' : 'CLAIMED BY YOU'} · #{String(id).padStart(4, '0')}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <span className="font-mono font-bold tabular-nums text-sm text-white">{formatUnits(reward, 6)} <span className="text-white/25 font-normal text-[10px]">USDC</span></span>
        <span className="font-mono text-[9px] tracking-wider px-2 py-1 border" style={{ color, borderColor: `${color}30` }}>
          {BOUNTY_STATUS[status]}
        </span>
      </div>
    </div>
  )
}

// Single listing row — only renders if user is involved
function ListingRow({ id, userAddress }: { id: number; userAddress: string }) {
  const { data } = useReadContract({
    address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'getListing',
    args: [BigInt(id)], chainId: ARC_TESTNET_ID,
  })
  if (!data) return null
  const { seller, buyer, price, status, title, category } = data
  const isSeller = seller.toLowerCase() === userAddress.toLowerCase()
  const isBuyer = buyer.toLowerCase() === userAddress.toLowerCase()
  if (!isSeller && !isBuyer) return null
  if (status === 4) return null // cancelled
  const color = LISTING_COLORS[status] ?? '#ffffff20'
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-white/70 truncate">{title}</p>
        <p className="font-mono text-[9px] text-white/25 mt-0.5 tracking-wider">
          {isSeller ? 'LISTED BY YOU' : 'PURCHASED BY YOU'} · {category.toUpperCase()} · #{String(id).padStart(4, '0')}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <span className="font-mono font-bold tabular-nums text-sm text-white">{formatUnits(price, 6)} <span className="text-white/25 font-normal text-[10px]">USDC</span></span>
        <span className="font-mono text-[9px] tracking-wider px-2 py-1 border" style={{ color, borderColor: `${color}30` }}>
          {LISTING_STATUS[status]}
        </span>
      </div>
    </div>
  )
}

function ActivityLists({ address }: { address: string }) {
  const { data: bountyCount } = useReadContract({ address: BOARD_ADDRESS, abi: BOARD_ABI, functionName: 'bountyCount', chainId: ARC_TESTNET_ID })
  const { data: listingCount } = useReadContract({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'listingCount', chainId: ARC_TESTNET_ID })
  const bCount = bountyCount ? Number(bountyCount) : 0
  const lCount = listingCount ? Number(listingCount) : 0

  return (
    <>
      {/* Bounties */}
      <Section title="CHAOSBOARD ACTIVITY" icon={<ClipboardList size={12} />}>
        {bCount === 0 ? (
          <p className="px-5 py-6 font-mono text-[10px] text-white/15 tracking-wider">NO BOUNTIES YET</p>
        ) : (
          Array.from({ length: bCount }, (_, i) => bCount - 1 - i).map(i => (
            <BountyRow key={i} id={i} userAddress={address} />
          ))
        )}
      </Section>

      {/* Listings */}
      <Section title="CHAOSMARKET ACTIVITY" icon={<ShoppingBag size={12} />}>
        {lCount === 0 ? (
          <p className="px-5 py-6 font-mono text-[10px] text-white/15 tracking-wider">NO LISTINGS YET</p>
        ) : (
          Array.from({ length: lCount }, (_, i) => lCount - 1 - i).map(i => (
            <ListingRow key={i} id={i} userAddress={address} />
          ))
        )}
      </Section>
    </>
  )
}

export function ChaosIDPage({ sharedAddress }: { sharedAddress?: string | null }) {
  const { t } = useLocale()
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [lookupAddress, setLookupAddress] = useState('')
  const [queried, setQueried] = useState<`0x${string}` | null>(
    sharedAddress && /^0x[0-9a-fA-F]{40}$/.test(sharedAddress) ? sharedAddress as `0x${string}` : null
  )
  const [lookupError, setLookupError] = useState('')

  const targetAddress = queried ?? address
  const chain = requireChain(ARC_TESTNET_ID)
  const wrongChain = isConnected && chainId !== ARC_TESTNET_ID

  // Profile
  const { data: profile, refetch } = useReadContract({
    address: CHAOS_ID_ADDRESS, abi: CHAOS_ID_ABI, functionName: 'getProfile',
    args: targetAddress ? [targetAddress] : undefined,
    chainId: ARC_TESTNET_ID, query: { enabled: !!targetAddress },
  }) as { data: ChaosProfile | undefined; refetch: () => void }

  // USDC ERC-20 balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    chainId: ARC_TESTNET_ID, query: { enabled: !!targetAddress },
  })

  // Native balance (Arc = USDC native)
  const { data: nativeBalance } = useBalance({
    address: targetAddress, chainId: ARC_TESTNET_ID, query: { enabled: !!targetAddress },
  })

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })
  useEffect(() => { if (isSuccess) { void refetch() } }, [isSuccess, refetch])

  const score = profile?.exists ? Number(profile.reputationScore) : 0
  const isRegistered = profile?.exists ?? false
  const isOwnProfile = !queried || queried === address
  const tier = getTier(score)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const tierProgress = nextTier ? Math.min((score - tier.min) / (nextTier.min - tier.min), 1) * 100 : 100

  const handleRegister = () => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    writeContract({ address: CHAOS_ID_ADDRESS, abi: CHAOS_ID_ABI, functionName: 'register' })
  }

  const handleLookup = () => {
    const val = lookupAddress.trim()
    if (/^0x[0-9a-fA-F]{40}$/.test(val)) {
      setQueried(val as `0x${string}`); setLookupError('')
    } else {
      setLookupError('Invalid — needs 0x + 40 hex chars')
    }
  }

  const usdcAmount = usdcBalance ? Number(formatUnits(usdcBalance, 6)) : 0
  const nativeAmount = nativeBalance ? Number(nativeBalance.formatted) : 0

  return (
    <div className="min-h-dvh bg-[#080808] text-white pt-14">

      {/* Wrong chain */}
      <AnimatePresence>
        {wrongChain && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-[#ff4d00]/10 border-b border-[#ff4d00]/20 overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
              <AlertTriangle size={12} className="text-[#ff4d00] shrink-0" />
              <p className="font-mono text-[10px] tracking-wider text-[#ff4d00]">{t('id.wrong')}</p>
              <button onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
                className="ml-auto font-mono text-[10px] text-[#ff4d00] underline underline-offset-2">{t('id.switch')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-3">

        {/* ── HEADER ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] tracking-[0.28em] text-white/20 mb-1">CHAOS ECOSYSTEM / IDENTITY</p>
            <h1 className="font-mono font-black leading-none" style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', letterSpacing: '-0.03em' }}>
              CHAOS<span style={{ color: '#ff4d00' }}>//</span>ID
            </h1>
          </div>
          {/* Lookup bar */}
          <div className="flex gap-2 flex-1 max-w-xs">
            <div className="relative flex-1">
              <input type="text" value={lookupAddress}
                onChange={e => { setLookupAddress(e.target.value); setLookupError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder={t('id.lookup')}
                className="w-full bg-transparent border border-white/[0.07] font-mono text-xs text-white placeholder-white/15 px-3 py-2 focus:outline-none focus:border-[#ff4d00]/40 transition-colors" />
            </div>
            <button onClick={handleLookup}
              className="font-mono text-[10px] px-3 py-2 border border-white/[0.07] text-white/30 hover:border-[#ff4d00]/40 hover:text-[#ff4d00] transition-colors">
              <Search size={12} />
            </button>
            {queried && (
              <button onClick={() => { setQueried(null); setLookupAddress('') }}
                className="font-mono text-[10px] px-2.5 py-2 border border-white/[0.05] text-white/20 hover:text-white/50 transition-colors">
                ✕
              </button>
            )}
          </div>
        </motion.div>
        {lookupError && <p className="font-mono text-[10px] text-red-400 flex items-center gap-1.5"><XCircle size={10} /> {lookupError}</p>}
        {queried && <p className="font-mono text-[9px] text-[#ff4d00]/70 tracking-wider flex items-center gap-1.5"><Search size={9} /> VIEWING {queried}</p>}

        {!targetAddress ? (
          <div className="border border-white/[0.05] py-20 text-center">
            <Wallet size={24} className="text-white/10 mx-auto mb-3" />
            <p className="font-mono text-xs text-white/20 tracking-widest">{t('id.connect')}</p>
          </div>
        ) : (
          <>
            {/* ── IDENTITY CARD ────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="border border-white/[0.06] bg-[#0c0c0c]">

              {/* Address row */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Color dot = tier */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: isRegistered ? tier.color : '#333', boxShadow: isRegistered ? `0 0 8px ${tier.color}60` : 'none' }} />
                  <span className="font-mono text-[11px] text-white/60 truncate">{targetAddress}</span>
                  <CopyButton text={targetAddress} />
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <ShareButton address={targetAddress} />
                  <a href={`${chain.explorerBase}/address/${targetAddress}`} target="_blank" rel="noopener noreferrer"
                    className="text-white/15 hover:text-[#ff4d00] transition-colors">
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.05]">
                {/* USDC balance */}
                <div className="p-5">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1.5">
                    <Wallet size={9} /> {t('id.usdc')}
                  </p>
                  <p className="font-mono font-black tabular-nums leading-none text-white" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}>
                    <AnimatedNumber value={usdcAmount} prefix="$" />
                  </p>
                  <p className="font-mono text-[9px] text-white/20 mt-1">ERC-20 · ARC TESTNET</p>
                </div>

                {/* Gas balance */}
                <div className="p-5">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1.5">
                    <Zap size={9} /> {t('id.gas')}
                  </p>
                  <p className="font-mono font-black tabular-nums leading-none text-white" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}>
                    {nativeAmount > 0 ? nativeAmount.toFixed(4) : '—'}
                  </p>
                  <p className="font-mono text-[9px] text-white/20 mt-1">NATIVE · USDC GAS</p>
                </div>

                {/* Reputation */}
                <div className="p-5">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1.5">
                    <Shield size={9} /> {t('id.reputation')}
                  </p>
                  <p className="font-mono font-black tabular-nums leading-none" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', color: isRegistered ? tier.color : 'rgba(255,255,255,0.1)' }}>
                    <AnimatedNumber value={score} />
                  </p>
                  <p className="font-mono text-[9px] mt-1" style={{ color: isRegistered ? `${tier.color}70` : 'rgba(255,255,255,0.1)' }}>
                    {isRegistered ? tier.label : t('id.unregistered')}
                  </p>
                </div>

                {/* Tx count */}
                <div className="p-5">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-2 flex items-center gap-1.5">
                    <Activity size={9} /> {t('id.transactions')}
                  </p>
                  <p className="font-mono font-black tabular-nums leading-none text-white" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em' }}>
                    <AnimatedNumber value={isRegistered && profile ? Number(profile.txCount) : 0} delay={0.1} />
                  </p>
                  <p className="font-mono text-[9px] text-white/20 mt-1">
                    {isRegistered && profile ? `$${(Number(profile.volumeUsdc) / 1e6).toFixed(2)} VOLUME` : t('id.noHistory')}
                  </p>
                </div>
              </div>

              {/* Tier progress bar */}
              {isRegistered && nextTier && (
                <div className="px-5 py-3.5 border-t border-white/[0.05]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
                    <span className="font-mono text-[9px] text-white/20">{nextTier.label} at {nextTier.min} pts</span>
                  </div>
                  <div className="h-[2px] bg-white/[0.06] overflow-hidden">
                    <motion.div className="h-full" style={{ background: tier.color }}
                      initial={{ width: 0 }} animate={{ width: `${tierProgress}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
                  </div>
                </div>
              )}

              {/* Register CTA */}
              <AnimatePresence>
                {isConnected && isOwnProfile && !isRegistered && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="px-5 pb-5 pt-3 border-t border-white/[0.05]">
                    <p className="font-mono text-[10px] text-white/25 mb-3">{t('id.registerInfo')}</p>
                    <button onClick={handleRegister} disabled={isPending || isConfirming || wrongChain}
                      className="font-mono text-[11px] tracking-[0.15em] px-6 py-3 transition-all disabled:opacity-30"
                      style={{ background: '#ff4d00', color: '#000', fontWeight: 800 }}>
                      {isPending ? `${t('nav.connect')}…` : isConfirming ? '…' : t('id.register')}
                    </button>
                    {writeError && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 border border-red-500/20 bg-red-500/5">
                        <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="font-mono text-[10px] text-red-400">{writeError.message.slice(0, 120)}</p>
                      </div>
                    )}
                    {isSuccess && txHash && (
                      <div className="mt-2 flex items-center justify-between px-3 py-2 border border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                          <span className="font-mono text-[10px] text-emerald-400">{t('id.registered')}</span>
                        </div>
                        <a href={buildTxExplorerUrl(ARC_TESTNET_ID, txHash)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-[10px] text-white/30 hover:text-white">
                          TX <ExternalLink size={9} />
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── MULTI-CHAIN BALANCE ──────────────────── */}
            {targetAddress && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="border border-white/[0.06] bg-[#0d0d0d] p-5">
                <MultiChainBalance address={targetAddress} />
              </motion.div>
            )}

            {/* ── ACTIVITY SECTIONS ────────────────────── */}
            <ActivityLists address={targetAddress} />

            {/* ── ADMIN PANEL ──────────────────────────── */}
            <AdminPanel />

            {/* ── CONTRACT LINKS ───────────────────────── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="border border-white/[0.04] bg-[#0a0a0a] divide-y divide-white/[0.04]">
              {[
                { label: 'CHAOSID CONTRACT', addr: CHAOS_ID_ADDRESS },
                { label: 'CHAOSBOARD CONTRACT', addr: BOARD_ADDRESS },
                { label: 'CHAOSMARKET CONTRACT', addr: MARKET_ADDRESS },
              ].map(({ label, addr }) => (
                <a key={addr} href={`${chain.explorerBase}/address/${addr}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3 group">
                  <span className="font-mono text-[9px] tracking-widest text-white/20 group-hover:text-white/40 transition-colors">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-white/10 hidden sm:block">{addr.slice(0, 10)}…{addr.slice(-6)}</span>
                    <ChevronRight size={10} className="text-white/15 group-hover:text-[#ff4d00] transition-colors" />
                  </div>
                </a>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

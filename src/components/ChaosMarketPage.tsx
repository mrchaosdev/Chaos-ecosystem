import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, parseUnits, formatUnits } from 'viem'
import { Plus, X, Tag, CheckCircle2, Truck, ShoppingBag, AlertTriangle, XCircle } from 'lucide-react'
import { TiltCard, MagneticButton } from '@/components/MagneticButton'
import { useLocale } from '@/i18n/LocaleProvider'

import { toast } from 'sonner'

const MARKET_ADDRESS = '0x55203bc963be0731c8f013bc1de7f1fbb253b311' as const
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
const ARC_TESTNET_ID = 5042002

const MARKET_ABI = [
  { name: 'listingCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getListing', type: 'function', stateMutability: 'view', inputs: [{ name: 'listingId', type: 'uint256' }], outputs: [{ components: [{ name: 'seller', type: 'address' }, { name: 'buyer', type: 'address' }, { name: 'price', type: 'uint256' }, { name: 'status', type: 'uint8' }, { name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'category', type: 'string' }, { name: 'disputeDeadline', type: 'uint256' }], name: '', type: 'tuple' }] },
  { name: 'createListing', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'title', type: 'string' }, { name: 'description', type: 'string' }, { name: 'category', type: 'string' }, { name: 'price', type: 'uint256' }], outputs: [{ name: 'listingId', type: 'uint256' }] },
  { name: 'buyListing', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'listingId', type: 'uint256' }], outputs: [] },
  { name: 'markDelivered', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'listingId', type: 'uint256' }], outputs: [] },
  { name: 'confirmDelivery', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'listingId', type: 'uint256' }], outputs: [] },
  { name: 'cancelListing', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'listingId', type: 'uint256' }], outputs: [] },
] as const

const STATUS_LABELS = ['ACTIVE', 'SOLD', 'DELIVERED', 'CONFIRMED', 'CANCELLED']
const STATUS_COLORS: Record<number, string> = {
  0: '#ff4d00', 1: '#ffd700', 2: '#00e5ff', 3: '#4ade80', 4: 'rgba(255,255,255,0.15)',
}
const CATEGORIES = ['design', 'code', 'writing', 'marketing', 'other']
const CAT_COLORS: Record<string, string> = {
  design: '#ff4d00', code: '#00e5ff', writing: '#ffd700', marketing: '#4ade80', other: 'rgba(255,255,255,0.3)',
}

function formatAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function InputField({ label, value, onChange, placeholder, type = 'text', rows, children }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; rows?: number; children?: React.ReactNode
}) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.2em] text-white/25 block mb-1.5">{label}</label>
      {children ?? (rows ? (
        <textarea value={value} onChange={e => onChange?.(e.target.value)} rows={rows} placeholder={placeholder}
          className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#ff4d00]/40 transition-colors resize-none" />
      ) : (
        <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} type={type}
          className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#ff4d00]/40 transition-colors" />
      ))}
    </div>
  )
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useLocale()
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('design')
  const [price, setPrice] = useState('')

  const { writeContract: create, data: hash, isPending, error: txError } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) setTimeout(() => { toast.success('Listing created!'); onCreated(); onClose() }, 0)
  }, [isSuccess, onCreated, onClose])

  const handleCreate = () => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    create({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'createListing', args: [title, description, category, parseUnits(price || '0', 6)] })
  }

  const canCreate = !!title.trim() && !!price && Number(price) > 0 && !!address

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/[0.1] p-6 sm:p-7"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-[9px] tracking-[0.22em] text-white/20 mb-1">CHAOS MARKET</p>
            <h2 className="font-mono text-xl font-bold tracking-tight">{t('market.createTitle')}</h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/70 transition-colors p-1 -mr-1"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <InputField label={t('market.title')} value={title} onChange={setTitle} placeholder={t('market.titleHint')} />
          <InputField label={t('market.description')} value={description} onChange={setDescription} rows={2} placeholder={t('market.descriptionHint')} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label={t('market.category')} value={category} onChange={() => {}}>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#080808] border border-white/[0.08] px-3 py-2.5 font-mono text-xs text-white focus:outline-none appearance-none cursor-pointer"
                style={{ color: CAT_COLORS[category] ?? 'white' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </InputField>
            <InputField label={t('market.price')} value={price} onChange={setPrice} placeholder="25" type="number" />
          </div>
        </div>

        {price && Number(price) > 0 && (
          <div className="mt-4 p-3.5 bg-[#0a0a0a] border border-white/[0.06] flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-widest text-white/25">{t('market.listingPrice')}</span>
            <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: CAT_COLORS[category] ?? '#ff4d00', letterSpacing: '-0.02em' }}>
              {price}<span className="text-xs text-white/30 ml-1">USDC</span>
            </span>
          </div>
        )}

        {txError && (
          <div className="mt-3 flex items-start gap-2 p-3 border border-red-500/20 bg-red-500/5">
            <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[10px] text-red-400 leading-relaxed">{txError.message.slice(0, 140)}</p>
          </div>
        )}

        <div className="mt-5">
          <button onClick={handleCreate} disabled={!canCreate || isPending}
            className="w-full font-mono text-[11px] tracking-[0.15em] py-3.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
            {isPending ? t('market.sign') : t('market.createAction')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ListingCardProps { id: number; categoryFilter: string | null; onAction: () => void }

function ListingCard({ id, categoryFilter, onAction }: ListingCardProps) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [buyStep, setBuyStep] = useState<'idle' | 'approve' | 'buy'>('idle')

  const { data: listing } = useReadContract({
    address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'getListing',
    args: [BigInt(id)], chainId: ARC_TESTNET_ID,
  })

  const { writeContract: approveUsdc, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract()
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  const { writeContract: action, data: actionHash, isPending: actionPending, error: actionError } = useWriteContract()
  const { isSuccess: actionSuccess } = useWaitForTransactionReceipt({ hash: actionHash })

  useEffect(() => {
    if (approveSuccess && buyStep === 'approve') setTimeout(() => setBuyStep('buy'), 0)
  }, [approveSuccess, buyStep])
  useEffect(() => {
    if (actionSuccess) setTimeout(() => { toast.success('Done!'); onAction() }, 0)
  }, [actionSuccess, onAction])

  if (!listing) return null
  const { seller, buyer, price, status, title, description, category } = listing

  // Filter: hide cancelled; hide if category doesn't match
  if (status === 4) return null
  if (categoryFilter !== null && category !== categoryFilter) return null

  const isSeller = address?.toLowerCase() === seller.toLowerCase()
  const isBuyer = address?.toLowerCase() === buyer.toLowerCase()
  const statusColor = STATUS_COLORS[status] ?? 'rgba(255,255,255,0.2)'
  const catColor = CAT_COLORS[category] ?? 'rgba(255,255,255,0.3)'
  const txError = approveError ?? actionError

  const handleBuy = () => {
    if (chainId !== ARC_TESTNET_ID) { switchChain({ chainId: ARC_TESTNET_ID }); return }
    setBuyStep('approve')
    approveUsdc({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [MARKET_ADDRESS, price] })
  }

  return (
    <TiltCard className="border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#0d0d0d' }} intensity={3}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(id * 0.03, 0.25) }} className="p-5">

        {/* Category + status + id */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
          <span className="font-mono text-[9px] tracking-[0.18em] font-bold" style={{ color: catColor }}>
            {category.toUpperCase()}
          </span>
          <span className="text-white/10">·</span>
          <span className="font-mono text-[9px] tracking-[0.18em]" style={{ color: statusColor }}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-white/10">·</span>
          <span className="font-mono text-[9px] text-white/15">#{String(id).padStart(4, '0')}</span>
        </div>

        {/* Title + price */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-[15px] leading-snug">{title}</h3>
            {description && <p className="text-white/25 text-[11px] mt-1.5 line-clamp-2 leading-relaxed">{description}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono font-bold tabular-nums leading-none text-white" style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
              {formatUnits(price, 6)}
            </p>
            <p className="font-mono text-[9px] tracking-widest text-white/20 mt-0.5">USDC</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.04]">
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-white/20">
            <Tag size={8} /> {formatAddr(seller)}
          </span>

          <div className="flex items-center gap-2">
            {/* Buy flow */}
            {status === 0 && !isSeller && address && (
              <>
                {buyStep === 'idle' && (
                  <button onClick={handleBuy}
                    className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] px-3 py-1.5 border transition-all"
                    style={{ color: '#ff4d00', borderColor: 'rgba(255,77,0,0.25)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <ShoppingBag size={9} /> BUY →
                  </button>
                )}
                {buyStep === 'approve' && (
                  <span className="font-mono text-[10px] text-white/25">
                    {approvePending ? 'SIGN APPROVAL…' : 'CONFIRMING…'}
                  </span>
                )}
                {buyStep === 'buy' && (
                  <button onClick={() => action({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'buyListing', args: [BigInt(id)] })}
                    disabled={actionPending}
                    className="font-mono text-[10px] tracking-[0.12em] px-3 py-1.5 border transition-all disabled:opacity-30"
                    style={{ color: '#ff4d00', borderColor: 'rgba(255,77,0,0.25)', background: 'rgba(255,77,0,0.08)' }}>
                    {actionPending ? 'SIGN…' : 'CONFIRM BUY →'}
                  </button>
                )}
              </>
            )}

            {/* Seller: cancel */}
            {status === 0 && isSeller && (
              <button onClick={() => action({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'cancelListing', args: [BigInt(id)] })}
                disabled={actionPending}
                className="font-mono text-[9px] tracking-wider text-white/20 hover:text-white/50 transition-colors disabled:opacity-30">
                CANCEL
              </button>
            )}
            {/* Seller: mark delivered */}
            {status === 1 && isSeller && (
              <button onClick={() => action({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'markDelivered', args: [BigInt(id)] })}
                disabled={actionPending}
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] px-3 py-1.5 border transition-all disabled:opacity-30"
                style={{ color: '#ffd700', borderColor: 'rgba(255,215,0,0.2)' }}>
                <Truck size={9} /> MARK DELIVERED →
              </button>
            )}
            {/* Buyer: confirm */}
            {status === 2 && isBuyer && (
              <button onClick={() => action({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'confirmDelivery', args: [BigInt(id)] })}
                disabled={actionPending}
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] px-3 py-1.5 border transition-all disabled:opacity-30"
                style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.2)' }}>
                <CheckCircle2 size={9} /> CONFIRM →
              </button>
            )}
          </div>
        </div>

        {/* Inline error */}
        {txError && (
          <div className="mt-3 flex items-start gap-2 p-2.5 border border-red-500/15 bg-red-500/5">
            <XCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-[9px] text-red-400 leading-relaxed">{txError.message.slice(0, 100)}</p>
          </div>
        )}
        {actionSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 border border-emerald-500/15 bg-emerald-500/5">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <p className="font-mono text-[9px] text-emerald-400 tracking-wider">TRANSACTION CONFIRMED</p>
          </div>
        )}
      </motion.div>
    </TiltCard>
  )
}

export function ChaosMarketPage() {
  const { t } = useLocale()
  const [showCreate, setShowCreate] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { address, chainId } = useAccount()
  const wrongChain = address && chainId !== ARC_TESTNET_ID

  const { data: listingCount, refetch } = useReadContract({
    address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: 'listingCount', chainId: ARC_TESTNET_ID,
  })
  const count = listingCount ? Number(listingCount) : 0
  const handleRefresh = () => { setRefreshKey(k => k + 1); void refetch() }

  return (
    <div className="min-h-dvh bg-[#080808] text-white pt-14">

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-wrap items-start justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-[9px] tracking-[0.28em] text-white/20 mb-2">CHAOS ECOSYSTEM / MARKETPLACE</p>
            <h1 className="font-mono font-black leading-none" style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', letterSpacing: '-0.03em' }}>
              CHAOS<span style={{ color: '#ff4d00' }}>//</span>MARKET
            </h1>
            <p className="font-mono text-[10px] text-white/20 tracking-widest mt-2">
              {count} {t('market.heading')}
            </p>
          </motion.div>
          {address && (
            <MagneticButton onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] px-5 py-3"
              style={{ background: '#ff4d00', color: '#000', fontWeight: 700 }}>
              <Plus size={12} /> {t('market.create')}
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
              <p className="font-mono text-[10px] tracking-wider text-[#ff4d00]">WRONG NETWORK — switch to ARC TESTNET to buy or list</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {[null, ...CATEGORIES].map(c => (
            <button key={String(c)} onClick={() => setCategoryFilter(c)}
              className="font-mono text-[9px] tracking-[0.18em] px-3.5 py-1.5 border transition-all"
              style={{
                borderColor: categoryFilter === c ? (c ? CAT_COLORS[c] : '#ff4d00') : 'rgba(255,255,255,0.07)',
                color: categoryFilter === c ? (c ? CAT_COLORS[c] : '#ff4d00') : 'rgba(255,255,255,0.25)',
                background: categoryFilter === c ? `${c ? CAT_COLORS[c] : '#ff4d00'}0a` : 'transparent',
              }}>
              {c === null ? 'ALL' : c.toUpperCase()}
            </button>
          ))}
        </div>

        {count === 0 ? (
          <div className="text-center py-24 border border-white/[0.04]">
            <p className="font-mono text-xs text-white/15 tracking-widest">{t('market.none')}</p>
            {address && <p className="font-mono text-[10px] text-white/10 mt-3">{t('market.emptyConnected')}</p>}
            {!address && <p className="font-mono text-[10px] text-white/10 mt-3">{t('market.emptyDisconnected')}</p>}
          </div>
        ) : (
          <div className="space-y-2.5" key={refreshKey}>
            {Array.from({ length: count }, (_, i) => count - 1 - i).map(i => (
              <ListingCard key={i} id={i} categoryFilter={categoryFilter} onAction={handleRefresh} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleRefresh} />}
      </AnimatePresence>
    </div>
  )
}

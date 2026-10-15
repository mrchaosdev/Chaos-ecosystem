import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Shield, CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { buildTxExplorerUrl, requireChain } from '@/onchain-facts'

const CHAOS_ID_ADDRESS = '0x763cba888b02b29e3bf631fb78de732e439f54a9' as const
const BOARD_ADDRESS    = '0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7' as const
const MARKET_ADDRESS   = '0x55203bc963be0731c8f013bc1de7f1fbb253b311' as const
const OWNER_ADDRESS    = '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' as const
const ARC_TESTNET_ID   = 5042002

const CHAOS_ID_ABI = [
  {
    name: 'authorizedCallers',
    type: 'function', stateMutability: 'view',
    inputs: [{ name: 'caller', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'setAuthorizedCaller',
    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'caller', type: 'address' }, { name: 'authorized', type: 'bool' }],
    outputs: [],
  },
  {
    name: 'owner',
    type: 'function', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

function AuthCallerRow({
  label, contractAddress, color,
}: {
  label: string; contractAddress: `0x${string}`; color: string
}) {
  const { address, chainId } = useAccount()
  const chain = requireChain(ARC_TESTNET_ID)

  const { data: isAuthorized, refetch } = useReadContract({
    address: CHAOS_ID_ADDRESS, abi: CHAOS_ID_ABI,
    functionName: 'authorizedCallers', args: [contractAddress],
    chainId: ARC_TESTNET_ID,
  })

  const { writeContract, data: txHash, isPending, error } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  if (isSuccess) { void refetch() }

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase()
  const canAct  = isOwner && chainId === ARC_TESTNET_ID

  const toggle = (authorize: boolean) => {
    writeContract({
      address: CHAOS_ID_ADDRESS, abi: CHAOS_ID_ABI,
      functionName: 'setAuthorizedCaller',
      args: [contractAddress, authorize],
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Status indicator */}
        <span className="shrink-0 w-2 h-2 rounded-full"
          style={{ background: isAuthorized ? '#4ade80' : 'rgba(255,255,255,0.1)' }} />
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold" style={{ color }}>{label}</p>
          <p className="font-mono text-[9px] text-white/20 truncate">{contractAddress}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Status badge */}
        <span className="font-mono text-[9px] tracking-widest px-2 py-0.5"
          style={{
            color: isAuthorized ? '#4ade80' : 'rgba(255,255,255,0.2)',
            background: isAuthorized ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
          }}>
          {isAuthorized === undefined ? '...' : isAuthorized ? 'AUTHORIZED' : 'NOT AUTH'}
        </span>

        {/* Action button — only for owner */}
        {canAct && !isPending && (
          <button
            onClick={() => toggle(!isAuthorized)}
            className="font-mono text-[9px] tracking-widest px-3 py-1 border transition-all"
            style={{
              color: isAuthorized ? '#ff4d4f' : '#4ade80',
              borderColor: isAuthorized ? 'rgba(255,77,79,0.25)' : 'rgba(74,222,128,0.25)',
            }}>
            {isAuthorized ? 'REVOKE' : 'AUTHORIZE →'}
          </button>
        )}
        {isPending && (
          <span className="font-mono text-[9px] text-white/30 tracking-widest">SIGNING…</span>
        )}

        {/* Explorer link */}
        <a href={`${chain.explorerBase}/address/${contractAddress}`}
          target="_blank" rel="noopener noreferrer"
          className="text-white/15 hover:text-[#ff4d00] transition-colors">
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Inline feedback */}
      {(error || isSuccess) && (
        <div className="w-full">
          {error && (
            <div className="flex items-start gap-2 p-2.5 border border-red-500/15 bg-red-500/5">
              <XCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
              <p className="font-mono text-[9px] text-red-400">{error.message.slice(0, 100)}</p>
            </div>
          )}
          {isSuccess && txHash && (
            <div className="flex items-center justify-between p-2.5 border border-emerald-500/15 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={10} className="text-emerald-400" />
                <span className="font-mono text-[9px] text-emerald-400 tracking-wider">DONE</span>
              </div>
              <a href={buildTxExplorerUrl(ARC_TESTNET_ID, txHash)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[9px] text-white/30 hover:text-white">
                TX <ExternalLink size={8} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminPanel() {
  const { address } = useAccount()
  const [open, setOpen] = useState(false)

  // Read actual owner from contract
  const { data: onchainOwner } = useReadContract({
    address: CHAOS_ID_ADDRESS, abi: CHAOS_ID_ABI,
    functionName: 'owner', chainId: ARC_TESTNET_ID,
  })

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase()
    || (onchainOwner && address?.toLowerCase() === onchainOwner.toLowerCase())

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      className="border border-white/[0.06] bg-[#0a0a0a]">

      {/* Header — always visible */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 group">
        <div className="flex items-center gap-3">
          <Shield size={13} className={isOwner ? 'text-[#ffd700]' : 'text-white/20'} />
          <div className="text-left">
            <p className="font-mono text-[9px] tracking-[0.22em] text-white/20">REPUTATION SYSTEM</p>
            <p className="font-mono text-[11px] font-bold text-white/60 group-hover:text-white transition-colors">
              AUTHORIZED CALLERS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <span className="font-mono text-[8px] tracking-widest px-2 py-0.5 bg-[#ffd700]/10 text-[#ffd700]">
              OWNER
            </span>
          )}
          {open ? <ChevronUp size={12} className="text-white/20" /> : <ChevronDown size={12} className="text-white/20" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.04]">
            <div className="px-5 py-1">

              {!isOwner && (
                <p className="font-mono text-[9px] text-white/20 leading-relaxed py-3">
                  Only the contract owner (<span className="text-white/40">{OWNER_ADDRESS.slice(0,10)}…</span>) can authorize callers.
                  Connect with the owner wallet to enable reputation tracking.
                </p>
              )}

              <AuthCallerRow label="CHAOSBOARD" contractAddress={BOARD_ADDRESS} color="#ff4d00" />
              <AuthCallerRow label="CHAOSMARKET" contractAddress={MARKET_ADDRESS} color="#00e5ff" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

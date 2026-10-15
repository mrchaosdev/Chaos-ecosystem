import { motion } from 'framer-motion'
import { BridgePanel } from '@/components/BridgePanel'
import { useLocale } from '@/i18n/LocaleProvider'

export function BridgePage() {
  const { t } = useLocale()
  return (
    <div className="min-h-dvh bg-[#080808] text-white pt-14">
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-[9px] tracking-[0.28em] text-white/20 mb-2">CHAOS ECOSYSTEM / BRIDGE</p>
            <h1 className="font-mono font-black leading-none" style={{ fontSize: 'clamp(1.8rem,5vw,3rem)', letterSpacing: '-0.03em' }}>
              CHAOS<span style={{ color: '#ff4d00' }}>//</span>BRIDGE
            </h1>
            <p className="font-mono text-[10px] text-white/20 tracking-widest mt-2">
              {t('bridge.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <BridgePanel />
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.04] mt-4">
          {[
            { label: t('bridge.protocol'), value: 'CCTP V2' },
            { label: t('bridge.speed'), value: '~8-20 SEC' },
            { label: t('bridge.fee'), value: t('bridge.networkFee') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0a0a0a] px-5 py-4">
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/20 mb-1">{label}</p>
              <p className="font-mono text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'

interface ComingSoonProps {
  name: string
  description: string
}

export function ComingSoon({ name, description }: ComingSoonProps) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white pt-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <p className="font-mono text-[10px] tracking-widest text-white/20 mb-3">CHAOS ECOSYSTEM</p>
        <h1 className="font-mono text-3xl font-bold tracking-tight mb-2">
          CHAOS<span className="text-[#ff4d00]">//</span>{name}
        </h1>
        <p className="font-mono text-sm text-white/30 mb-8 max-w-sm mx-auto">{description}</p>
        <div className="inline-block border border-white/10 px-6 py-2">
          <span className="font-mono text-[11px] tracking-widest text-white/30">PHASE {name === 'BOARD' ? '2' : '3'} — COMING NEXT</span>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {([0, 1, 2]).map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-[#ff4d00]"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

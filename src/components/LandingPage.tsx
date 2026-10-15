/**
 * Chaos Ecosystem — Landing Page v4
 * No GSAP, no WebGL. Pure Framer Motion + CSS.
 * Framer whileInView works in iframe; GSAP ScrollTrigger does not.
 */
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { MagneticButton } from './MagneticButton'

const ACCENT = '#ff4d00'
const BOARD_COLOR = '#ffd700'
const MARKET_COLOR = '#00e5ff'

// ─── Scramble ─────────────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!'
function GlitchText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const el = useRef<HTMLSpanElement>(null)
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null)
  const scramble = () => {
    const node = el.current; if (!node) return
    let iter = 0
    if (ticker.current) clearInterval(ticker.current)
    ticker.current = setInterval(() => {
      node.textContent = text.split('').map((ch, i) => {
        if (ch === ' ') return ' '
        if (i < iter) return text[i]
        return CHARS[Math.floor(Math.random() * CHARS.length)]
      }).join('')
      iter += 0.5
      if (iter > text.length) { clearInterval(ticker.current!); node.textContent = text }
    }, 28)
  }
  useEffect(() => {
    const t = setTimeout(scramble, 400)
    return () => { clearTimeout(t); if (ticker.current) clearInterval(ticker.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <span ref={el} className={className} style={style} onMouseEnter={scramble}>{text}</span>
}

// ─── Word cycle ───────────────────────────────────────────────────────────────
const WORDS = ['IDENTITY', 'TRUST', 'BOUNTIES', 'REPUTATION', 'MARKET']
function WordCycle() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % WORDS.length), 2000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="inline-block relative overflow-hidden align-bottom" style={{ minWidth: '13ch' }}>
      <AnimatePresence mode="wait">
        <motion.span key={i} className="inline-block"
          initial={{ y: '110%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-110%', opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          style={{ color: ACCENT }}>
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Reveal ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </motion.div>
    </div>
  )
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'CHAOS//ID', '·', 'CHAOS//BOARD', '·', 'CHAOS//MARKET', '·',
  'BUILT ON ARC', '·', 'USDC AS GAS', '·', 'NO MIDDLEMEN', '·',
  'ESCROWED USDC', '·', 'ONCHAIN REPUTATION', '·',
]
function Marquee() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="overflow-hidden py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        style={{ width: 'max-content' }}
        animate={{ x: [0, '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        {items.map((item, i) => (
          <span key={i} className="font-mono text-[9px] tracking-[0.2em]"
            style={{ color: item === '·' ? ACCENT : 'rgba(255,255,255,0.18)' }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// ─── App card ─────────────────────────────────────────────────────────────────
function AppCard({ n, tag, name, desc, accent, address, delay }: {
  n: string; tag: string; name: string; desc: string; accent: string
  address: string; delay: number
}) {
  const glow = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  return (
    <Reveal delay={delay}>
      <div
        className="relative overflow-hidden h-full"
        style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', cursor: 'default' }}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect()
          if (glow.current) glow.current.style.background =
            `radial-gradient(360px at ${e.clientX - r.left}px ${e.clientY - r.top}px, ${accent}12 0%, transparent 65%)`
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (glow.current) glow.current.style.background = ''; setHovered(false) }}>

        {/* Top bar */}
        <div className="h-[2px] transition-all duration-500" style={{ width: hovered ? '100%' : '0%', background: accent }} />
        <div ref={glow} className="absolute inset-0 pointer-events-none" />

        <div className="p-7 md:p-8">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <span className="font-mono text-[8px] tracking-[0.22em] border px-2 py-0.5"
              style={{ color: accent, borderColor: `${accent}45` }}>{tag}</span>
            <span className="font-mono font-black tabular-nums shrink-0"
              style={{ fontSize: '3rem', color: `${accent}12`, lineHeight: 1 }}>{n}</span>
          </div>
          {/* Name */}
          <h3 className="font-mono font-black text-white mb-3"
            style={{ fontSize: 'clamp(1.2rem, 1.9vw, 1.6rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {name}
          </h3>
          {/* Desc */}
          <p className="font-mono text-[10px] text-white/30 leading-relaxed tracking-wide mb-6">{desc}</p>
          {/* Address */}
          <div className="font-mono text-[8px] tracking-[0.06em] text-white/15 border-t border-white/[0.04] pt-4">
            {address.slice(0, 6)}···{address.slice(-4)}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── How step ─────────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'REGISTER ONCE', body: 'Call ChaosID.register(). Your onchain profile exists forever.' },
  { n: '02', title: 'POST OR LIST', body: 'Lock USDC in escrow. Contract holds it until both sides confirm.' },
  { n: '03', title: 'DELIVER', body: 'Submit proof. Approval releases USDC instantly — no invoices, no waiting.' },
  { n: '04', title: 'EARN REPUTATION', body: 'Every completed tx updates your ChaosID score onchain. Immutable.' },
]
function HowStep({ n, title, body, delay }: { n: string; title: string; body: string; delay: number }) {
  return (
    <Reveal delay={delay} y={16}>
      <div className="flex gap-5 items-start py-7" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="font-mono font-black shrink-0 tabular-nums"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: `${ACCENT}22`, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {n}
        </span>
        <div className="pt-0.5">
          <div className="font-mono font-bold text-white text-[11px] tracking-[0.18em] mb-1.5">{title}</div>
          <div className="font-mono text-[10px] text-white/28 leading-relaxed tracking-wider">{body}</div>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
function Stat({ v, l, accent, delay }: { v: string; l: string; accent?: boolean; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="flex flex-col items-center justify-center py-10 md:py-14 bg-[#0a0a0a]">
        <span className="font-mono font-black tabular-nums"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', letterSpacing: '-0.04em', color: accent ? ACCENT : '#fff' }}>
          {v}
        </span>
        <span className="font-mono text-[7.5px] tracking-[0.26em] text-white/18 mt-2">{l}</span>
      </div>
    </Reveal>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function LandingPage({ onEnter, onDocs }: { onEnter: () => void; onDocs: () => void }) {
  return (
    <div className="relative text-white overflow-x-hidden"
      style={{ background: '#0a0a0a', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 h-14"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(18px)' }}>
        <span className="font-mono text-sm font-black tracking-widest">
          CHAOS<span style={{ color: ACCENT }}>//</span>
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={onDocs} className="font-mono text-[9px] tracking-[0.18em] px-2 sm:px-3 py-2 text-white/35 hover:text-[#ff4d00] transition-colors duration-200">DOCS</button>
          <button onClick={onEnter}
            className="font-mono text-[9px] tracking-[0.18em] px-3 sm:px-4 py-2 text-white/35 hover:text-[#ff4d00] transition-colors duration-200"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            LAUNCH APP →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-dvh flex flex-col items-center justify-center px-5 sm:px-8 text-center pt-14 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 50%,transparent 15%,#0a0a0a 85%)' }} />
        {/* Glow orb */}
        <div className="absolute pointer-events-none" style={{
          top: '44%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 700, height: 500,
          background: `radial-gradient(ellipse, ${ACCENT}09 0%, transparent 65%)`,
          filter: 'blur(40px)',
        }} />

        <div className="relative z-10 max-w-5xl w-full mx-auto">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 1 }}
            className="font-mono text-[7px] sm:text-[8px] tracking-[0.3em] text-white/16 mb-8 sm:mb-10">
            BUILT ON ARC · USDC AS GAS · CIRCLE SMART CONTRACT PLATFORM
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono font-black select-none leading-[0.85] mb-6 sm:mb-8"
            style={{ fontSize: 'clamp(4.5rem, 16vw, 13rem)', letterSpacing: '-0.045em' }}>
            <GlitchText text="CHAOS" />
            <span style={{ color: ACCENT }}>//</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 sm:mb-12">
            <p className="font-mono font-semibold" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.7rem)', letterSpacing: '-0.015em' }}>
              <span className="text-white/18">ONCHAIN</span>{' '}<WordCycle />
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <MagneticButton onClick={onEnter}
              className="font-mono font-black text-[10px] sm:text-[11px] tracking-[0.2em] px-8 sm:px-10 py-3.5 sm:py-4"
              style={{ background: ACCENT, color: '#000' }}>
              ENTER APP →
            </MagneticButton>
            <button
              onClick={() => document.getElementById('apps')?.scrollIntoView({ behavior: 'smooth' })}
              className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] px-7 sm:px-9 py-3.5 sm:py-4 text-white/22 hover:text-white/55 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              EXPLORE ↓
            </button>
          </motion.div>
        </div>

        {/* Scroll arrow */}
        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={{ opacity: [0.15, 0.5, 0.15] }} transition={{ duration: 2.8, repeat: Infinity }}>
          <div className="w-px h-9 mx-auto"
            style={{ background: `linear-gradient(to bottom, transparent, ${ACCENT}50)` }} />
        </motion.div>
      </section>

      {/* MARQUEE */}
      <Marquee />

      {/* STATS */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4"
          style={{ gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
          <Stat v="3" l="LIVE CONTRACTS" delay={0} />
          <Stat v="ARC" l="CHAIN" delay={0.06} />
          <Stat v="USDC" l="GAS TOKEN" delay={0.12} />
          <Stat v="0" l="MIDDLEMEN" accent delay={0.18} />
        </div>
      </div>

      {/* THREE APPS */}
      <section id="apps" className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 py-20 sm:py-28">
        <Reveal>
          <div className="mb-12 sm:mb-16">
            <span className="font-mono text-[7px] sm:text-[8px] tracking-[0.28em] text-white/18 block mb-4">
              THREE APPS · ONE ECOSYSTEM
            </span>
            <h2 className="font-mono font-black leading-none"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 4.2rem)', letterSpacing: '-0.04em' }}>
              EVERYTHING YOU NEED<br />
              <span style={{ color: ACCENT }}>NOTHING YOU DON'T.</span>
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
          <AppCard n="01" tag="CHAOS//ID" name="ONCHAIN IDENTITY"
            desc="One profile per wallet. Reputation score built from real transactions across all three apps."
            accent={ACCENT} address="0x763cba888b02b29e3bf631fb78de732e439f54a9" delay={0} />
          <AppCard n="02" tag="CHAOS//BOARD" name="BOUNTY ENGINE"
            desc="Post a task, lock USDC as reward. Claimer delivers, you approve — funds release instantly."
            accent={BOARD_COLOR} address="0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7" delay={0.07} />
          <AppCard n="03" tag="CHAOS//MARKET" name="SERVICE MARKET"
            desc="Seller lists, buyer funds escrow. 7-day protection built into the contract. No platform needed."
            accent={MARKET_COLOR} address="0x55203bc963be0731c8f013bc1de7f1fbb253b311" delay={0.14} />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 py-20 sm:py-28">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-12 md:gap-20 items-start">
            <Reveal>
              <div className="md:sticky md:top-24">
                <span className="font-mono text-[7px] sm:text-[8px] tracking-[0.28em] text-white/18 block mb-4">
                  HOW IT WORKS
                </span>
                <h2 className="font-mono font-black leading-[0.88]"
                  style={{ fontSize: 'clamp(2.6rem, 5vw, 4.8rem)', letterSpacing: '-0.04em' }}>
                  FROM<br />ZERO<br />TO{' '}<span style={{ color: ACCENT }}>PAID.</span>
                </h2>
              </div>
            </Reveal>
            <div>
              {STEPS.map(({ n, title, body }, idx) => (
                <HowStep key={n} n={n} title={title} body={body} delay={idx * 0.08} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTRACTS */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 py-16 sm:py-20">
          <Reveal>
            <span className="font-mono text-[7px] sm:text-[8px] tracking-[0.28em] text-white/18 block mb-8">
              LIVE ON ARC TESTNET
            </span>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3"
            style={{ gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
            {[
              { tag: 'CHAOS//ID', addr: '0x763cba888b02b29e3bf631fb78de732e439f54a9', accent: ACCENT },
              { tag: 'CHAOS//BOARD', addr: '0x01bb68f66c9397d60db9f845f07dadbf0eb67ed7', accent: BOARD_COLOR },
              { tag: 'CHAOS//MARKET', addr: '0x55203bc963be0731c8f013bc1de7f1fbb253b311', accent: MARKET_COLOR },
            ].map(({ tag, addr, accent }, i) => (
              <Reveal key={tag} delay={i * 0.07}>
                <a href={`https://explorer.arc.io/address/${addr}`} target="_blank" rel="noopener noreferrer"
                  className="block bg-[#0a0a0a] p-5 sm:p-6 group"
                  style={{ textDecoration: 'none' }}>
                  <span className="font-mono text-[8px] tracking-[0.2em] block mb-3"
                    style={{ color: accent }}>{tag}</span>
                  <span className="font-mono text-[9px] text-white/25 group-hover:text-white/50 transition-colors break-all">
                    {addr}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-10 py-20 sm:py-28 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10">
          <Reveal>
            <h2 className="font-mono font-black leading-none"
              style={{ fontSize: 'clamp(3rem, 8vw, 7.5rem)', letterSpacing: '-0.045em' }}>
              ENTER<br /><span style={{ color: ACCENT }}>CHAOS//</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex flex-col items-start gap-3">
              <MagneticButton onClick={onEnter}
                className="font-mono font-black text-[11px] sm:text-[12px] tracking-[0.2em] px-10 sm:px-12 py-4 sm:py-5"
                style={{ background: ACCENT, color: '#000' }}>
                ENTER APP →
              </MagneticButton>
              <span className="font-mono text-[7px] sm:text-[8px] tracking-[0.2em] text-white/14">
                ARC TESTNET · NO REAL FUNDS NEEDED
              </span>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  )
}

import { useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  disabled?: boolean
  strength?: number
}

/**
 * Physics-driven magnetic button — cursor pulls the button toward itself.
 * Inspired by FeralUI physics patterns.
 */
export function MagneticButton({
  children, className, style, onClick, disabled, strength = 0.35,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const x = useSpring(rawX, { stiffness: 220, damping: 18, mass: 0.6 })
  const y = useSpring(rawY, { stiffness: 220, damping: 18, mass: 0.6 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    rawX.set((e.clientX - cx) * strength)
    rawY.set((e.clientY - cy) * strength)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{ x, y, ...style }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.96 }}
    >
      {children}
    </motion.button>
  )
}

// ─── Tilt card — 3D perspective tilt on hover ─────────────────────────────────

interface TiltCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  intensity?: number
}

export function TiltCard({ children, className, style, intensity = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glowX = useMotionValue(50)
  const glowY = useMotionValue(50)

  const springRotX = useSpring(rotateX, { stiffness: 200, damping: 22, mass: 0.5 })
  const springRotY = useSpring(rotateY, { stiffness: 200, damping: 22, mass: 0.5 })

  // Subtle glow gradient that follows cursor
  const background = useTransform(
    [glowX, glowY],
    ([lx, ly]) =>
      `radial-gradient(circle at ${lx as number}% ${ly as number}%, rgba(255,77,0,0.07) 0%, transparent 60%)`,
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rotateY.set((px - 0.5) * intensity * 2)
    rotateX.set((0.5 - py) * intensity)
    glowX.set(px * 100)
    glowY.set(py * 100)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glowX.set(50)
    glowY.set(50)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springRotX, rotateY: springRotY, transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cursor-following inner glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background }}
      />
      {children}
    </motion.div>
  )
}

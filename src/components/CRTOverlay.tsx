/**
 * CRT scanline + phosphor glow overlay.
 * Inspired by ThreeUI CRT component and MotionSites CRT template.
 * Usage: wrap any element, or render as fixed overlay.
 */
export function CRTScanlines({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,${opacity}) 2px,
          rgba(0,0,0,${opacity}) 4px
        )`,
        mixBlendMode: 'multiply',
      }}
    />
  )
}

// Phosphor vignette — subtle darkening at edges
export function PhosphorVignette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[998]"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)',
      }}
    />
  )
}

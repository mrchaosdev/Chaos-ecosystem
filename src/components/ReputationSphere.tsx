import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float, Trail, Stars } from '@react-three/drei'
import * as THREE from 'three'

interface SphereProps {
  score: number
  isRegistered: boolean
}

// Fixed starting offsets per ring slot (no Math.random in render)
const ORBIT_OFFSETS = [0.8, 2.4, 4.7]

// Orbiting particle ring
function OrbitRing({ color, radius, speed, tilt, slot }: { color: string; radius: number; speed: number; tilt: number; slot: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const trailMeshRef = useRef<THREE.Mesh>(null)
  const t = useRef(ORBIT_OFFSETS[slot % ORBIT_OFFSETS.length] ?? 0)

  useFrame((_, delta) => {
    if (!groupRef.current || !trailMeshRef.current) return
    t.current += delta * speed
    groupRef.current.rotation.z = tilt
    trailMeshRef.current.position.x = Math.cos(t.current) * radius
    trailMeshRef.current.position.y = Math.sin(t.current) * radius
    trailMeshRef.current.position.z = 0
  })

  return (
    <group ref={groupRef}>
      <Trail width={0.04} length={6} color={color} attenuation={(t) => t * t}>
        <mesh ref={trailMeshRef}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Trail>
    </group>
  )
}

// Wireframe equator ring
function EquatorRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15 + Math.PI / 2
    ringRef.current.rotation.y = state.clock.elapsedTime * 0.1
  })
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[1.28, 0.008, 8, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  )
}

function SceneInner({ score, isRegistered }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const distort = useMemo(() => {
    if (!isRegistered) return 0.08
    return Math.min(0.1 + score / 1800, 0.65)
  }, [score, isRegistered])

  const color = useMemo(() => {
    if (!isRegistered) return '#2a2a2a'
    if (score < 50) return '#ff4d00'
    if (score < 200) return '#ff8c00'
    if (score < 500) return '#ffd700'
    return '#00e5ff'
  }, [score, isRegistered])

  const accentColor = useMemo(() => {
    if (!isRegistered) return '#444444'
    if (score < 50) return '#ff7a40'
    if (score < 200) return '#ffaa44'
    if (score < 500) return '#ffe066'
    return '#66f5ff'
  }, [score, isRegistered])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    meshRef.current.rotation.x = t * 0.12
    meshRef.current.rotation.y = t * 0.18
    // Subtle breathe scale
    const breathe = 1 + Math.sin(t * 0.8) * 0.018
    meshRef.current.scale.setScalar(breathe)
  })

  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.15} />

      {/* Key light from score color */}
      <pointLight position={[3, 4, 4]} intensity={isRegistered ? 2.5 : 0.5} color={color} />

      {/* Fill light cool */}
      <pointLight position={[-4, -2, -3]} intensity={0.6} color="#4488ff" />

      {/* Rim light */}
      <pointLight position={[0, -4, 2]} intensity={0.4} color={accentColor} />

      {/* Background stars — only when registered */}
      {isRegistered && <Stars radius={8} depth={4} count={300} factor={0.6} saturation={0} fade speed={0.5} />}

      {/* Main sphere */}
      <Float speed={isRegistered ? 1.4 : 0.4} rotationIntensity={0} floatIntensity={isRegistered ? 0.3 : 0.05}>
        <Sphere ref={meshRef} args={[1, 96, 96]}>
          <MeshDistortMaterial
            color={color}
            distort={distort}
            speed={isRegistered ? 2.5 : 0.4}
            roughness={0.08}
            metalness={0.85}
            wireframe={!isRegistered}
            envMapIntensity={1.2}
          />
        </Sphere>
      </Float>

      {/* Equator ring */}
      <EquatorRing color={accentColor} />

      {/* Orbiting particles — only when registered */}
      {isRegistered && (
        <>
          <OrbitRing color={accentColor} radius={1.6} speed={1.2} tilt={0} slot={0} />
          <OrbitRing color={color} radius={1.85} speed={0.7} tilt={Math.PI / 4} slot={1} />
          {score >= 200 && <OrbitRing color="#ffffff" radius={2.1} speed={0.45} tilt={-Math.PI / 3} slot={2} />}
        </>
      )}
    </>
  )
}

export function ReputationSphere({ score, isRegistered }: SphereProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <SceneInner score={score} isRegistered={isRegistered} />
      </Canvas>
    </div>
  )
}

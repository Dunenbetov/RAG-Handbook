import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CLUSTERS = 8
const PER_CLUSTER = 40
const COUNT = CLUSTERS * PER_CLUSTER
const ACCENT = new THREE.Color('#22d3ee')
const VIOLET = new THREE.Color('#8b5cf6')

// приближение нормального распределения — облако гуще к центру
function randn() {
  return Math.random() + Math.random() + Math.random() - 1.5
}

// мягкий круглый спрайт для точек — иначе PointsMaterial рисует квадраты
function makeCircleTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

function Cloud() {
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const { positions, colors, linePositions, circleTexture } = useMemo(() => {
    // тематические «кластеры смыслов»: точки группируются вокруг центров, как эмбеддинги похожих текстов
    const pts: THREE.Vector3[] = []
    const clusterOf: number[] = []
    for (let ci = 0; ci < CLUSTERS; ci++) {
      const center = new THREE.Vector3(randn(), randn(), randn())
        .normalize()
        .multiplyScalar(2.0 + Math.random() * 1.6)
      for (let k = 0; k < PER_CLUSTER; k++) {
        const offset = new THREE.Vector3(randn(), randn(), randn()).multiplyScalar(0.55)
        pts.push(center.clone().add(offset))
        clusterOf.push(ci)
      }
    }

    const positions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const c = new THREE.Color()
    pts.forEach((v, i) => {
      positions.set([v.x, v.y, v.z], i * 3)
      // цвет кодирует кластер (с лёгким разбросом) — свой «оттенок смысла» у каждой темы
      const t = clusterOf[i] / (CLUSTERS - 1)
      c.lerpColors(ACCENT, VIOLET, Math.min(1, Math.max(0, t + (Math.random() - 0.5) * 0.15)))
      colors.set([c.r, c.g, c.b], i * 3)
    })

    // рёбра между соседями: внутри кластера — плотно, между кластерами — изредка
    const segments: number[] = []
    for (let i = 0; i < COUNT && segments.length < 700 * 6; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const d = pts[i].distanceTo(pts[j])
        const sameCluster = clusterOf[i] === clusterOf[j]
        if ((sameCluster && d < 0.55) || (!sameCluster && d < 0.9 && Math.random() < 0.08)) {
          segments.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z)
        }
      }
    }
    return { positions, colors, linePositions: new Float32Array(segments), circleTexture: makeCircleTexture() }
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    if (!reduced) group.current.rotation.y += delta * 0.04
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.1 + pointer.current.y * 0.12, 0.04)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, pointer.current.x * 0.06, 0.04)
  })

  return (
    <group ref={group} rotation={[0.1, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={circleTexture}
          size={0.09}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8b5cf6" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  )
}

export default function HeroBackdrop() {
  const mask = 'radial-gradient(ellipse 80% 62% at 50% 42%, black 45%, transparent 82%)'
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-24 h-[58rem]" style={{ maskImage: mask, WebkitMaskImage: mask }}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <Cloud />
      </Canvas>
    </div>
  )
}

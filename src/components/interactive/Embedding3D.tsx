import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, Line, OrbitControls } from '@react-three/drei'
import { motion } from 'framer-motion'
import { Rotate3d } from 'lucide-react'

type V3 = [number, number, number]

interface Item {
  text: string
  v: V3
  cluster: string
}

// Те же документы, что на 2D-карте, но с тремя измерениями: направление вектора кодирует тему
const ITEMS: Item[] = [
  { text: 'кошка сидит на ковре', v: [0.88, 0.3, 0.37], cluster: 'животные' },
  { text: 'кот лежит на диване', v: [0.92, 0.2, 0.33], cluster: 'животные' },
  { text: 'собака грызёт кость', v: [0.8, 0.42, 0.43], cluster: 'животные' },
  { text: 'щенок играет во дворе', v: [0.74, 0.5, 0.45], cluster: 'животные' },
  { text: 'расторжение трудового договора', v: [-0.26, 0.9, 0.35], cluster: 'работа' },
  { text: 'увольнение по инициативе работодателя', v: [-0.38, 0.86, 0.34], cluster: 'работа' },
  { text: 'оплачиваемый отпуск работника', v: [-0.14, 0.94, 0.31], cluster: 'работа' },
  { text: 'испытательный срок при найме', v: [-0.47, 0.8, 0.37], cluster: 'работа' },
  { text: 'биржевые котировки упали', v: [-0.82, -0.36, 0.45], cluster: 'финансы' },
  { text: 'курс доллара вырос', v: [-0.76, -0.48, 0.44], cluster: 'финансы' },
  { text: 'инфляция составила 8.4%', v: [-0.86, -0.24, 0.45], cluster: 'финансы' },
  { text: 'рецепт бешбармака', v: [0.4, -0.78, -0.48], cluster: 'еда' },
  { text: 'как приготовить плов', v: [0.5, -0.72, -0.48], cluster: 'еда' },
  { text: 'баурсаки на кефире', v: [0.3, -0.83, -0.47], cluster: 'еда' },
]

const CLUSTER_COLORS: Record<string, string> = {
  животные: '#34d399',
  работа: '#22d3ee',
  финансы: '#fbbf24',
  еда: '#f87171',
}

const QUERIES: { text: string; v: V3 }[] = [
  { text: 'могут ли меня уволить на больничном?', v: [-0.33, 0.88, 0.34] },
  { text: 'домашние питомцы', v: [0.86, 0.33, 0.39] },
  { text: 'что приготовить на ужин?', v: [0.43, -0.76, -0.49] },
  { text: 'экономические новости', v: [-0.81, -0.37, 0.45] },
]

function cosSim(a: V3, b: V3) {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const na = Math.hypot(a[0], a[1], a[2])
  const nb = Math.hypot(b[0], b[1], b[2])
  return dot / (na * nb)
}

const SCALE = 2.2
const pos = (v: V3): V3 => [v[0] * SCALE, v[1] * SCALE, v[2] * SCALE]
const short = (t: string) => (t.length > 21 ? t.slice(0, 20) + '…' : t)

type Ranked = { item: Item; i: number; sim: number }[]

function Scene({ queryIdx, ranked }: { queryIdx: number; ranked: Ranked }) {
  const query = QUERIES[queryIdx]
  const top3 = new Set(ranked.slice(0, 3).map((r) => r.i))
  const qp = pos(query.v)

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={0.8} />

      {/* оси трёх измерений */}
      <Line points={[[-3, 0, 0], [3, 0, 0]]} color="#2a3560" lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
      <Line points={[[0, -3, 0], [0, 3, 0]]} color="#2a3560" lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />
      <Line points={[[0, 0, -3], [0, 0, 3]]} color="#2a3560" lineWidth={1} dashed dashSize={0.12} gapSize={0.1} />

      {/* документы */}
      {ITEMS.map((item, i) => {
        const p = pos(item.v)
        const isTop = top3.has(i)
        return (
          <group key={item.text} position={p}>
            <mesh>
              <sphereGeometry args={[isTop ? 0.11 : 0.07, 24, 24]} />
              <meshStandardMaterial
                color={CLUSTER_COLORS[item.cluster]}
                emissive={CLUSTER_COLORS[item.cluster]}
                emissiveIntensity={isTop ? 0.7 : 0.2}
              />
            </mesh>
            <Html center distanceFactor={5.5} position={[0, 0.22, 0]} className="pointer-events-none">
              <div className={`whitespace-nowrap text-[11px] ${isTop ? 'font-medium text-white' : 'text-muted/70'}`}>
                {short(item.text)}
              </div>
            </Html>
          </group>
        )
      })}

      {/* линии от запроса к top-3 с косинусным сходством */}
      {ranked.slice(0, 3).map(({ item, sim }, rank) => {
        const p = pos(item.v)
        const mid: V3 = [(qp[0] + p[0]) / 2, (qp[1] + p[1]) / 2, (qp[2] + p[2]) / 2]
        return (
          <group key={item.text}>
            <Line points={[qp, p]} color="#8b5cf6" lineWidth={rank === 0 ? 2 : 1.2} transparent opacity={0.85 - rank * 0.2} />
            <Html center distanceFactor={5.5} position={mid} className="pointer-events-none">
              <span className="font-mono text-[10px] text-violet-300">{sim.toFixed(2)}</span>
            </Html>
          </group>
        )
      })}

      {/* запрос */}
      <group position={qp}>
        <mesh>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.9} />
        </mesh>
        <Html center distanceFactor={5.5} position={[0, -0.3, 0]} className="pointer-events-none">
          <span className="whitespace-nowrap text-[11px] font-semibold text-violet-300">запрос</span>
        </Html>
      </group>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.7} />
    </>
  )
}

export function Embedding3D() {
  const [queryIdx, setQueryIdx] = useState(0)
  const query = QUERIES[queryIdx]

  const ranked: Ranked = useMemo(
    () => ITEMS.map((item, i) => ({ item, i, sim: cosSim(query.v, item.v) })).sort((a, b) => b.sim - a.sim),
    [query],
  )

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-white">
        <Rotate3d className="size-4 text-accent" /> Пространство эмбеддингов — тексты с похожим смыслом живут рядом
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setQueryIdx(i)}
              className={`rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                i === queryIdx ? 'border-violet bg-violet/15 text-white' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              «{q.text}»
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="relative h-[420px] overflow-hidden rounded-xl border border-line bg-bg/60">
            <Canvas camera={{ position: [3.4, 2.4, 5.2], fov: 45 }} dpr={[1, 2]}>
              <Scene queryIdx={queryIdx} ranked={ranked} />
            </Canvas>
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-line bg-bg/80 px-2.5 py-1.5 text-[11px] text-muted backdrop-blur">
              <Rotate3d className="size-3.5" /> потяни мышкой, чтобы вращать
            </div>
          </div>

          {/* топ результатов */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Top-3 по косинусному сходству</div>
            <div className="space-y-2">
              {ranked.slice(0, 3).map(({ item, sim }, rank) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rank * 0.1 }}
                  className="rounded-xl border border-line bg-surface-2 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">#{rank + 1}</span>
                    <span className="font-mono text-sm font-bold text-accent">{sim.toFixed(3)}</span>
                  </div>
                  <div className="text-[13px] leading-snug text-ink/90">{item.text}</div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg">
                    <motion.div
                      animate={{ width: `${Math.max(sim, 0) * 100}%` }}
                      className="h-full rounded-full"
                      style={{ background: CLUSTER_COLORS[item.cluster] }}
                    />
                  </div>
                </motion.div>
              ))}
              <div className="rounded-xl border border-line/50 p-3 text-[12px] text-muted">
                Худший результат: «{ranked[ranked.length - 1].item.text}» —{' '}
                <span className="font-mono text-bad">{ranked[ranked.length - 1].sim.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          {Object.entries(CLUSTER_COLORS).map(([name, color]) => (
            <span key={name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: color }} />
              {name}
            </span>
          ))}
          <span className="ml-auto">3 измерения вместо 1024 — принцип тот же</span>
        </div>
      </div>
    </div>
  )
}

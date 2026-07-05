import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Waypoints } from 'lucide-react'

interface Node {
  id: string
  label: string
  type: 'Person' | 'Organization' | 'Product' | 'Location' | 'University' | 'Technology' | 'Department'
  x: number
  y: number
}

interface Edge {
  from: string
  to: string
  label: string
}

const TYPE_COLORS: Record<Node['type'], string> = {
  Person: '#22d3ee',
  Organization: '#8b5cf6',
  Product: '#34d399',
  Location: '#fbbf24',
  University: '#f472b6',
  Technology: '#f87171',
  Department: '#60a5fa',
}

const NODES: Node[] = [
  { id: 'aslan', label: 'Аслан Нурпеисов', type: 'Person', x: 90, y: 70 },
  { id: 'marat', label: 'Марат Касымов', type: 'Person', x: 105, y: 210 },
  { id: 'aigul', label: 'Айгуль Сатпаева', type: 'Person', x: 90, y: 330 },
  { id: 'neurotech', label: 'НейроТех', type: 'Organization', x: 280, y: 160 },
  { id: 'ds', label: 'Data Science', type: 'Department', x: 250, y: 320 },
  { id: 'kaznu', label: 'КазНУ', type: 'University', x: 90, y: 425 },
  { id: 'smartcredit', label: 'SmartCredit', type: 'Product', x: 445, y: 90 },
  { id: 'eyedoc', label: 'EyeDoc', type: 'Product', x: 470, y: 210 },
  { id: 'most', label: 'MOST Ventures', type: 'Organization', x: 300, y: 40 },
  { id: 'almaty', label: 'Алматы', type: 'Location', x: 445, y: 330 },
  { id: 'gb', label: 'Gradient Boosting', type: 'Technology', x: 590, y: 140 },
]

const EDGES: Edge[] = [
  { from: 'aslan', to: 'neurotech', label: 'FOUNDED' },
  { from: 'marat', to: 'neurotech', label: 'CTO_OF' },
  { from: 'aigul', to: 'ds', label: 'LEADS' },
  { from: 'aigul', to: 'marat', label: 'REPORTS_TO' },
  { from: 'aigul', to: 'kaznu', label: 'GRADUATED_FROM' },
  { from: 'ds', to: 'neurotech', label: 'PART_OF' },
  { from: 'neurotech', to: 'smartcredit', label: 'DEVELOPED' },
  { from: 'neurotech', to: 'eyedoc', label: 'DEVELOPED' },
  { from: 'most', to: 'neurotech', label: 'INVESTED_IN' },
  { from: 'most', to: 'almaty', label: 'LOCATED_IN' },
  { from: 'neurotech', to: 'almaty', label: 'LOCATED_IN' },
  { from: 'smartcredit', to: 'gb', label: 'USES_TECHNOLOGY' },
]

const QUESTIONS = [
  {
    q: 'Кто основал НейроТех?',
    hops: 1,
    path: ['aslan', 'neurotech'],
    cypher: `MATCH (p:Person)-[:FOUNDED]->(o:Organization {name: "НейроТех"})
RETURN p.name`,
    answer: 'Аслан Нурпеисов. Простой вопрос — 1 хоп, обычный RAG справился бы тоже.',
  },
  {
    q: 'Кто инвестировал в компанию, разработавшую SmartCredit?',
    hops: 2,
    path: ['smartcredit', 'neurotech', 'most'],
    cypher: `MATCH (i:Organization)-[:INVESTED_IN]->(o:Organization)
      -[:DEVELOPED]->(p:Product {name: "SmartCredit"})
RETURN i.name`,
    answer: 'MOST Ventures. Уже 2 хопа: нужно связать продукт с разработчиком, а разработчика — с инвестором. Naive RAG часто не находит оба факта в top-k чанках.',
  },
  {
    q: 'В каком городе находится инвестор SmartCredit?',
    hops: 3,
    path: ['smartcredit', 'neurotech', 'most', 'almaty'],
    cypher: `MATCH (p:Product {name: "SmartCredit"})<-[:DEVELOPED]-(o)
      <-[:INVESTED_IN]-(i)-[:LOCATED_IN]->(city)
RETURN city.name`,
    answer: 'Алматы. Цепочка из 3 хопов — классический кейс, где GraphRAG громит векторный поиск: граф просто идёт по связям.',
  },
  {
    q: 'Как Айгуль связана со SmartCredit?',
    hops: 3,
    path: ['aigul', 'ds', 'neurotech', 'smartcredit'],
    cypher: `MATCH path = shortestPath(
  (a:Person {name: "Айгуль Сатпаева"})-[*]-(p:Product {name: "SmartCredit"})
)
RETURN path`,
    answer: 'Айгуль возглавляет отдел Data Science, который входит в НейроТех — компанию-разработчика SmartCredit. shortestPath нашёл цепочку автоматически.',
  },
]

export function KnowledgeGraph() {
  const [qIdx, setQIdx] = useState<number | null>(null)
  const [run, setRun] = useState(0)
  const question = qIdx !== null ? QUESTIONS[qIdx] : null

  const pathEdges = useMemo(() => {
    if (!question) return new Map<string, number>()
    const map = new Map<string, number>()
    for (let i = 0; i < question.path.length - 1; i++) {
      const a = question.path[i]
      const b = question.path[i + 1]
      const edge = EDGES.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))
      if (edge) map.set(`${edge.from}-${edge.to}`, i)
    }
    return map
  }, [question])

  const pathNodes = useMemo(() => {
    if (!question) return new Map<string, number>()
    return new Map(question.path.map((id, i) => [id, i]))
  }, [question])

  const nodeById = useMemo(() => new Map(NODES.map((n) => [n.id, n])), [])

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <Waypoints className="size-4 text-accent" /> Граф знаний «НейроТех» — выбери вопрос и смотри обход графа
      </div>
      <div className="p-5">
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {QUESTIONS.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setQIdx(i)
                setRun((r) => r + 1)
              }}
              className={`rounded-xl border p-3 text-left text-[13px] font-medium transition-colors ${
                qIdx === i ? 'border-accent bg-accent/10 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              «{item.q}»
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${item.hops === 1 ? 'bg-good/15 text-good' : item.hops === 2 ? 'bg-warn/15 text-warn' : 'bg-bad/15 text-bad'}`}>
                {item.hops} hop{item.hops > 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>

        <svg viewBox="0 0 680 470" className="w-full rounded-xl border border-line bg-bg/60">
          {/* рёбра */}
          {EDGES.map((e) => {
            const from = nodeById.get(e.from)!
            const to = nodeById.get(e.to)!
            const key = `${e.from}-${e.to}`
            const hopIdx = pathEdges.get(key)
            const onPath = hopIdx !== undefined
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            return (
              <g key={key}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--color-line)" strokeWidth={1.5} />
                {onPath && (
                  <motion.line
                    key={`${key}-${run}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.55, delay: hopIdx * 0.65 }}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#22d3ee"
                    strokeWidth={3}
                    style={{ filter: 'drop-shadow(0 0 6px #22d3ee)' }}
                  />
                )}
                <text
                  x={mx}
                  y={my - 5}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fill={onPath ? 'var(--color-accent)' : 'var(--color-muted)'}
                  fontWeight={onPath ? 'bold' : 'normal'}
                >
                  {e.label}
                </text>
              </g>
            )
          })}

          {/* узлы */}
          {NODES.map((n) => {
            const hopIdx = pathNodes.get(n.id)
            const onPath = hopIdx !== undefined
            return (
              <g key={n.id}>
                {onPath && (
                  <motion.circle
                    key={`${n.id}-glow-${run}`}
                    cx={n.x}
                    cy={n.y}
                    r={20}
                    fill={TYPE_COLORS[n.type]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0.2] }}
                    transition={{ duration: 0.6, delay: hopIdx * 0.65 }}
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={13}
                  fill="var(--color-surface)"
                  stroke={TYPE_COLORS[n.type]}
                  strokeWidth={onPath ? 3 : 1.5}
                  opacity={question && !onPath ? 0.4 : 1}
                />
                {onPath && (
                  <motion.text
                    key={`${n.id}-num-${run}`}
                    x={n.x}
                    y={n.y + 3.5}
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={TYPE_COLORS[n.type]}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: hopIdx * 0.65 }}
                  >
                    {hopIdx + 1}
                  </motion.text>
                )}
                <text
                  x={n.x}
                  y={n.y + 27}
                  fontSize="9.5"
                  fontWeight={onPath ? 'bold' : 'normal'}
                  textAnchor="middle"
                  fill={onPath ? 'var(--color-ink)' : 'var(--color-muted)'}
                  opacity={question && !onPath ? 0.5 : 1}
                >
                  {n.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* легенда */}
        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
          {(Object.keys(TYPE_COLORS) as Node['type'][]).map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2" style={{ borderColor: TYPE_COLORS[t] }} />
              {t}
            </span>
          ))}
        </div>

        {question && (
          <motion.div key={qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-bg/60 p-4">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-violet">Cypher-запрос</div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-accent">{question.cypher}</pre>
            </div>
            <div className="rounded-xl border border-good/40 bg-good/5 p-4">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-good">Ответ графа</div>
              <p className="text-[13px] leading-relaxed text-ink/90">{question.answer}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

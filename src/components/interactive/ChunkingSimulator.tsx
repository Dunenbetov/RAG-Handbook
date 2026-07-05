import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import { Fav, No, Yes } from '../ui'

const SAMPLE = `Статья 52. Расторжение трудового договора по инициативе работодателя.

Трудовой договор с работником может быть расторгнут в случаях: 1) ликвидации работодателя; 2) сокращения численности или штата работников; 3) снижения объёма производства, повлекшего ухудшение экономического состояния работодателя.

Статья 53. Порядок расторжения трудового договора.

Работодатель обязан уведомить работника не менее чем за один месяц, если в трудовом договоре не предусмотрен более длительный срок уведомления.`

const COLORS = [
  'rgba(34, 211, 238, 0.16)',
  'rgba(139, 92, 246, 0.18)',
  'rgba(52, 211, 153, 0.14)',
  'rgba(251, 191, 36, 0.13)',
  'rgba(248, 113, 113, 0.14)',
  'rgba(96, 165, 250, 0.16)',
]
const BORDERS = ['#22d3ee', '#8b5cf6', '#34d399', '#fbbf24', '#f87171', '#60a5fa']

type Strategy = 'fixed' | 'sliding' | 'recursive'

interface Chunk {
  start: number
  end: number
}

function splitFixed(text: string, size: number): Chunk[] {
  const chunks: Chunk[] = []
  for (let i = 0; i < text.length; i += size) chunks.push({ start: i, end: Math.min(i + size, text.length) })
  return chunks
}

function splitSliding(text: string, size: number, overlap: number): Chunk[] {
  const step = Math.max(size - overlap, 20)
  const chunks: Chunk[] = []
  for (let i = 0; i < text.length; i += step) {
    chunks.push({ start: i, end: Math.min(i + size, text.length) })
    if (i + size >= text.length) break
  }
  return chunks
}

/** Упрощённый RecursiveCharacterTextSplitter: режем по \n\n → \n → ". " → " " */
function splitRecursive(text: string, size: number): Chunk[] {
  const seps = ['\n\n', '\n', '. ', ' ']

  function split(start: number, end: number, sepIdx: number): Chunk[] {
    if (end - start <= size) return [{ start, end }]
    if (sepIdx >= seps.length) return splitFixed(text.slice(start, end), size).map((c) => ({ start: start + c.start, end: start + c.end }))

    const sep = seps[sepIdx]
    const parts: Chunk[] = []
    let cursor = start
    while (cursor < end) {
      const idx = text.indexOf(sep, cursor)
      const partEnd = idx === -1 || idx >= end ? end : idx + sep.length
      parts.push({ start: cursor, end: partEnd })
      cursor = partEnd
    }

    // склеиваем соседние части, пока влезают в size; слишком большие режем разделителем ниже
    const result: Chunk[] = []
    let acc: Chunk | null = null
    for (const part of parts) {
      if (part.end - part.start > size) {
        if (acc) {
          result.push(acc)
          acc = null
        }
        result.push(...split(part.start, part.end, sepIdx + 1))
        continue
      }
      if (!acc) {
        acc = { ...part }
      } else if (part.end - acc.start <= size) {
        acc.end = part.end
      } else {
        result.push(acc)
        acc = { ...part }
      }
    }
    if (acc) result.push(acc)
    return result
  }

  return split(0, text.length, 0)
}

export function ChunkingSimulator() {
  const [strategy, setStrategy] = useState<Strategy>('sliding')
  const [size, setSize] = useState(180)
  const [overlap, setOverlap] = useState(40)

  const chunks = useMemo(() => {
    if (strategy === 'fixed') return splitFixed(SAMPLE, size)
    if (strategy === 'sliding') return splitSliding(SAMPLE, size, overlap)
    return splitRecursive(SAMPLE, size)
  }, [strategy, size, overlap])

  // для отрисовки: сегменты текста с принадлежностью к чанкам
  const segments = useMemo(() => {
    const points = new Set<number>([0, SAMPLE.length])
    chunks.forEach((c) => {
      points.add(c.start)
      points.add(c.end)
    })
    const sorted = [...points].sort((a, b) => a - b)
    return sorted.slice(0, -1).map((start, i) => {
      const end = sorted[i + 1]
      const owners = chunks.map((c, idx) => ({ c, idx })).filter(({ c }) => c.start <= start && c.end >= end)
      return { start, end, owners: owners.map((o) => o.idx) }
    })
  }, [chunks])

  const brokenSentences = useMemo(
    () =>
      chunks.filter((c) => {
        const lastChar = SAMPLE[c.end - 1]
        return c.end < SAMPLE.length && lastChar !== '.' && lastChar !== '\n' && SAMPLE[c.end] !== '\n'
      }).length,
    [chunks],
  )

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-white">
        <FlaskConical className="size-4 text-accent" /> Симулятор чанкинга — покрути параметры и посмотри, как режется текст
      </div>
      <div className="p-5">
        {/* стратегия */}
        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ['fixed', 'Fixed Size'],
              ['sliding', 'Sliding Window (overlap)'],
              ['recursive', 'Recursive'],
            ] as [Strategy, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStrategy(key)}
              className={`rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                strategy === key ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* слайдеры */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted">chunk_size (символов)</span>
              <span className="font-mono font-semibold text-accent">{size}</span>
            </div>
            <input
              type="range"
              min={60}
              max={400}
              step={10}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-[#22d3ee]"
            />
          </label>
          <label className={`block transition-opacity ${strategy === 'sliding' ? '' : 'pointer-events-none opacity-30'}`}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted">chunk_overlap (символов)</span>
              <span className="font-mono font-semibold text-violet">{overlap}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(150, size - 20)}
              step={10}
              value={Math.min(overlap, size - 20)}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="w-full accent-[#8b5cf6]"
            />
          </label>
        </div>

        {/* текст с подсветкой */}
        <div className="mb-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-bg/60 p-4 font-mono text-[12.5px] leading-[1.9]">
          {segments.map((seg, i) => {
            const isOverlap = seg.owners.length > 1
            const color = seg.owners.length ? COLORS[seg.owners[0] % COLORS.length] : 'transparent'
            const border = seg.owners.length ? BORDERS[seg.owners[0] % BORDERS.length] : 'transparent'
            return (
              <span
                key={i}
                style={{
                  background: isOverlap
                    ? `repeating-linear-gradient(45deg, ${COLORS[seg.owners[0] % COLORS.length]}, ${COLORS[seg.owners[0] % COLORS.length]} 6px, ${COLORS[seg.owners[1] % COLORS.length]} 6px, ${COLORS[seg.owners[1] % COLORS.length]} 12px)`
                    : color,
                  borderBottom: `2px solid ${isOverlap ? '#fbbf24' : border}`,
                }}
                title={isOverlap ? `Overlap: чанки ${seg.owners.map((o) => o + 1).join(' и ')}` : `Чанк ${seg.owners[0] + 1}`}
              >
                {SAMPLE.slice(seg.start, seg.end)}
              </span>
            )
          })}
        </div>

        {/* статистика */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <motion.div key={`n-${chunks.length}`} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="rounded-xl border border-line bg-surface-2 p-3">
            <div className="text-2xl font-bold text-accent">{chunks.length}</div>
            <div className="text-xs text-muted">чанков</div>
          </motion.div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <div className="text-2xl font-bold text-violet">
              {Math.round(chunks.reduce((s, c) => s + (c.end - c.start), 0) / Math.max(chunks.length, 1))}
            </div>
            <div className="text-xs text-muted">средний размер</div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <div className={`text-2xl font-bold ${brokenSentences > 0 ? 'text-bad' : 'text-good'}`}>{brokenSentences}</div>
            <div className="text-xs text-muted">оборванных предложений</div>
          </div>
        </div>

        <div className="mt-4 text-[13.5px] leading-relaxed text-muted">
          {strategy === 'fixed' && <><No />Fixed Size рубит текст ровно по счётчику — предложения и даже слова рвутся посередине. Смысл на границах теряется.</>}
          {strategy === 'sliding' && <><Fav />Sliding Window добавляет перекрытие (штриховка): мысль, разрезанная на границе, целиком попадает в соседний чанк. Золотой стандарт для 90% случаев.</>}
          {strategy === 'recursive' && <><Yes />Recursive сначала пробует резать по абзацам, потом по строкам и предложениям — границы чанков совпадают с логическими границами текста.</>}
        </div>
      </div>
    </div>
  )
}

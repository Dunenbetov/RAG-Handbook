import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import { No, Yes } from '../ui'

interface Doc {
  id: string
  title: string
}

const DOCS: Doc[] = [
  { id: 'a52', title: 'Статья 52. Расторжение договора по инициативе работодателя' },
  { id: 'a53', title: 'Статья 53. Порядок расторжения трудового договора' },
  { id: 'a88', title: 'Статья 88. Оплачиваемый ежегодный трудовой отпуск' },
  { id: 'a150', title: 'Статья 150. Заключение договора с иностранцами' },
  { id: 'a76', title: 'Статья 76. Ограничение работы в ночное время' },
]

// заранее посчитанные скоры (0..1) для двух типов запросов:
// точный запрос по номеру и семантический парафраз
const QUERIES = [
  {
    label: '«Что говорит статья 52?»',
    kind: 'точный (номер статьи)',
    bm25: { a52: 0.95, a53: 0.55, a88: 0.42, a150: 0.44, a76: 0.35 },
    vector: { a52: 0.52, a53: 0.58, a88: 0.5, a150: 0.61, a76: 0.42 },
    relevant: 'a52',
    note: 'Номер «52» — просто токен. BM25 находит его точным совпадением мгновенно, а в векторном пространстве числа почти неразличимы: эмбеддинги статей 52, 53 и 150 равноудалены от запроса.',
  },
  {
    label: '«Могут ли меня уволить без предупреждения?»',
    kind: 'семантический (парафраз)',
    bm25: { a52: 0.18, a53: 0.31, a88: 0.12, a150: 0.22, a76: 0.1 },
    vector: { a52: 0.87, a53: 0.82, a88: 0.35, a150: 0.4, a76: 0.28 },
    relevant: 'a52',
    note: 'Слова «уволить» нет в тексте статей — там «расторжение договора». BM25 не видит связи, а векторный поиск понимает, что это синонимы.',
  },
] as const

export function HybridSearchDemo() {
  const [queryIdx, setQueryIdx] = useState(0)
  const [alpha, setAlpha] = useState(0.5)
  const q = QUERIES[queryIdx]

  const rank = (scores: Record<string, number>) =>
    [...DOCS].sort((a, b) => scores[b.id] - scores[a.id])

  const bm25Ranked = useMemo(() => rank(q.bm25), [q])
  const vectorRanked = useMemo(() => rank(q.vector), [q])
  const hybridRanked = useMemo(() => {
    const scores = Object.fromEntries(DOCS.map((d) => [d.id, alpha * q.vector[d.id as keyof typeof q.vector] + (1 - alpha) * q.bm25[d.id as keyof typeof q.bm25]]))
    return [...DOCS].sort((a, b) => scores[b.id] - scores[a.id]).map((d) => ({ doc: d, score: scores[d.id] }))
  }, [q, alpha])

  const hybridWins = hybridRanked[0].doc.id === q.relevant

  const Column = ({ title, docs, color }: { title: string; docs: Doc[]; color: string }) => (
    <div>
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color }}>
        {title}
      </div>
      <div className="space-y-1.5">
        {docs.map((d, i) => (
          <div
            key={d.id}
            className={`rounded-lg border px-2.5 py-2 text-[11.5px] leading-tight ${
              d.id === q.relevant ? 'border-good/50 bg-good/10 text-title' : 'border-line bg-surface-2 text-muted'
            }`}
          >
            <span className="mr-1 font-mono font-bold" style={{ color }}>
              {i + 1}.
            </span>
            {d.title}
            {d.id === q.relevant && ' ✓'}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <Scale className="size-4 text-accent" /> Гибридный поиск — двигай α и смотри, кто побеждает
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {QUERIES.map((query, i) => (
            <button
              key={i}
              onClick={() => setQueryIdx(i)}
              className={`rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                i === queryIdx ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {query.label}
              <span className="ml-1.5 text-[11px] opacity-60">({query.kind})</span>
            </button>
          ))}
        </div>

        {/* alpha слайдер */}
        <div className="mb-5 rounded-xl border border-line bg-surface-2/50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-warn">BM25 (ключевые слова)</span>
            <span className="font-mono text-lg font-bold text-title">α = {alpha.toFixed(1)}</span>
            <span className="font-semibold text-accent">Vector (смысл)</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="w-full accent-[#8b5cf6]"
          />
          <div className="mt-1 text-center font-mono text-xs text-muted">
            score = <span className="text-accent">{alpha.toFixed(1)}</span>·vector + <span className="text-warn">{(1 - alpha).toFixed(1)}</span>·bm25
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Column title="только BM25" docs={bm25Ranked} color="var(--color-warn)" />
          <div>
            <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-violet">
              Hybrid (α = {alpha.toFixed(1)})
            </div>
            <div className="space-y-1.5">
              {hybridRanked.map(({ doc, score }, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={`rounded-lg border px-2.5 py-2 text-[11.5px] leading-tight ${
                    doc.id === q.relevant
                      ? 'border-good bg-good/15 text-title shadow-lg shadow-good/10'
                      : 'border-violet/30 bg-surface-2 text-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="mr-1 font-mono font-bold text-violet">{i + 1}.</span>
                      {doc.title}
                      {doc.id === q.relevant && ' ✓'}
                    </span>
                    <span className="ml-1 shrink-0 font-mono text-[10px] text-muted">{score.toFixed(2)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <Column title="только Vector" docs={vectorRanked} color="var(--color-accent)" />
        </div>

        <div className={`mt-4 rounded-xl border p-3.5 text-[13.5px] leading-relaxed ${hybridWins ? 'border-good/40 bg-good/5 text-ink/85' : 'border-bad/40 bg-bad/5 text-ink/85'}`}>
          {hybridWins ? <Yes /> : <No />}
          При α = {alpha.toFixed(1)} правильный документ {hybridWins ? 'на первом месте.' : 'НЕ на первом месте — двигай слайдер!'}{' '}
          {q.note}
        </div>
      </div>
    </div>
  )
}

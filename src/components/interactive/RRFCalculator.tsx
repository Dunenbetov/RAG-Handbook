import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator } from 'lucide-react'

const DOCS = ['Документ A', 'Документ B', 'Документ C', 'Документ D'] as const
const COLORS = ['var(--color-accent)', 'var(--color-violet)', 'var(--color-good)', 'var(--color-warn)']

/** Перестановка рангов: rankings[method][docIdx] = позиция (1..4) */
const PRESETS = [
  {
    name: 'Согласие методов',
    bm25: [1, 2, 3, 4],
    vector: [2, 1, 3, 4],
    note: 'Оба метода ставят A и B высоко — RRF уверенно выводит их в топ.',
  },
  {
    name: 'Конфликт методов',
    bm25: [1, 4, 2, 3],
    vector: [4, 1, 2, 3],
    note: 'BM25 любит A, вектор — B, но оба согласны, что C неплох. RRF поднимает C: стабильный «второй везде» ценнее спорного лидера.',
  },
] as const

export function RRFCalculator() {
  const [presetIdx, setPresetIdx] = useState(0)
  const [k, setK] = useState(60)
  const preset = PRESETS[presetIdx]

  const results = useMemo(() => {
    return DOCS.map((doc, i) => {
      const r1 = preset.bm25[i]
      const r2 = preset.vector[i]
      const s1 = 1 / (k + r1)
      const s2 = 1 / (k + r2)
      return { doc, i, r1, r2, s1, s2, total: s1 + s2 }
    }).sort((a, b) => b.total - a.total)
  }, [preset, k])

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <Calculator className="size-4 text-accent" /> Калькулятор RRF — как два рейтинга сливаются в один
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPresetIdx(i)}
              className={`rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                i === presetIdx ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            k =
            <input
              type="range"
              min={1}
              max={100}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="w-28 accent-[#22d3ee]"
            />
            <span className="w-8 font-mono font-bold text-accent">{k}</span>
          </label>
        </div>

        <div className="mb-4 rounded-xl border border-line bg-bg/60 p-4 text-center font-mono text-[15px] text-accent">
          RRF(doc) = 1/(k + rank<sub>BM25</sub>) + 1/(k + rank<sub>vector</sub>)
        </div>

        <div className="space-y-2">
          {results.map((r, pos) => (
            <motion.div
              key={r.doc}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`rounded-xl border p-3.5 ${pos === 0 ? 'border-good/50 bg-good/5' : 'border-line bg-surface-2'}`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-mono text-lg font-bold" style={{ color: COLORS[r.i] }}>
                  {pos + 1}. {r.doc}
                </span>
                <span className="font-mono text-[12.5px] text-muted">
                  1/({k}+{r.r1}) + 1/({k}+{r.r2}) = {r.s1.toFixed(4)} + {r.s2.toFixed(4)} ={' '}
                  <span className="font-bold text-title">{r.total.toFixed(4)}</span>
                </span>
                {pos === 0 && <span className="ml-auto text-xs font-semibold text-good">победитель</span>}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                <motion.div
                  animate={{ width: `${(r.total / results[0].total) * 100}%` }}
                  className="h-full rounded-full"
                  style={{ background: COLORS[r.i] }}
                />
              </div>
              <div className="mt-1.5 flex gap-4 text-[11px] text-muted">
                <span>BM25: место {r.r1}</span>
                <span>Vector: место {r.r2}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-[13.5px] leading-relaxed text-muted">{preset.note} Заметь: RRF работает только с <em>позициями</em>, поэтому не важно, что скоры BM25 и косинусное сходство измеряются в разных «единицах».</div>
      </div>
    </div>
  )
}

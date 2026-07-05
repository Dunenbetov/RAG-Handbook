import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Check, ClipboardList, Copy } from 'lucide-react'

interface Param {
  id: string
  name: string
  values: string[]
  baseline: string
  hint: string
}

const PARAMS: Param[] = [
  { id: 'chunk', name: 'Chunk Size', values: ['256', '512', '1024', '2048'], baseline: '1024', hint: 'Маленькие чанки точнее ищутся, но теряют контекст. Большие — наоборот.' },
  { id: 'overlap', name: 'Chunk Overlap', values: ['0', '50', '100', '200'], baseline: '200', hint: 'Больше overlap — меньше потерь на границах чанков.' },
  { id: 'strategy', name: 'Стратегия чанкинга', values: ['Fixed', 'Recursive', 'Layout-Aware'], baseline: 'Fixed', hint: 'Layout-Aware сохраняет таблицы целиком — критично для отчётов.' },
  { id: 'topk', name: 'Top-K', values: ['3', '5', '10', '15'], baseline: '5', hint: 'Больше K — больше контекста, но и больше шума (падает Context Precision).' },
  { id: 'alpha', name: 'Alpha (RRF)', values: ['0.0', '0.3', '0.5', '0.7', '1.0'], baseline: '0.5', hint: '0.0 — только BM25, 1.0 — только Vector. Ищи оптимум по Context Recall.' },
  { id: 'rerank', name: 'Reranking', values: ['Выкл', 'Вкл'], baseline: 'Выкл', hint: 'Обычно улучшает точность топа, но добавляет latency.' },
  { id: 'embed', name: 'Embedding-модель', values: ['e5-large', 'bge-m3', 'mpnet'], baseline: 'e5-large', hint: 'Разное качество на мультиязычных данных; bge-m3 держит контекст 8192 токена.' },
]

export function ExperimentPlanner() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['chunk', 'topk', 'alpha', 'rerank']))
  const [copied, setCopied] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const experiments = useMemo(() => {
    const rows: { n: number; change: string; config: Record<string, string>; note: string }[] = []
    const config: Record<string, string> = Object.fromEntries(PARAMS.map((p) => [p.id, p.baseline]))
    rows.push({ n: 0, change: 'Baseline', config: { ...config }, note: 'Отправная точка — все параметры по умолчанию' })

    let n = 1
    for (const p of PARAMS) {
      if (!selected.has(p.id)) continue
      for (const v of p.values) {
        if (v === p.baseline) continue
        rows.push({
          n: n++,
          change: `${p.name} → ${v}`,
          config: { ...config, [p.id]: `[${v}]` },
          note: p.hint,
        })
      }
      // greedy: дальше считаем, что взяли «лучшее» значение
      config[p.id] = 'best'
    }
    return rows
  }, [selected])

  const activeParams = PARAMS.filter((p) => selected.has(p.id))

  const markdown = useMemo(() => {
    const header = `| # | Что меняем | ${activeParams.map((p) => p.name).join(' | ')} | Faithf. | Ans.Rel. | C.Recall | C.Prec. | Вывод |`
    const sep = `|---|---|${activeParams.map(() => '---').join('|')}|---|---|---|---|---|`
    const body = experiments
      .map((e) => `| ${e.n} | ${e.change} | ${activeParams.map((p) => e.config[p.id]).join(' | ')} | ? | ? | ? | ? | |`)
      .join('\n')
    return [header, sep, body].join('\n')
  }, [experiments, activeParams])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // буфер обмена недоступен
    }
  }

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <ClipboardList className="size-4 text-accent" /> Планировщик экспериментов — собери свой greedy search
      </div>
      <div className="p-5">
        <div className="mb-2 text-sm text-muted">Выбери, какие гиперпараметры будешь варьировать (в ТЗ нужно минимум 6 экспериментов):</div>
        <div className="mb-5 flex flex-wrap gap-2">
          {PARAMS.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              title={p.hint}
              className={`rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                selected.has(p.id) ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {selected.has(p.id) ? '✓ ' : ''}
              {p.name}
            </button>
          ))}
        </div>

        <div className={`mb-4 rounded-xl border p-3 text-center text-sm font-semibold ${experiments.length - 1 >= 6 ? 'border-good/40 bg-good/5 text-good' : 'border-warn/40 bg-warn/5 text-warn'}`}>
          Экспериментов в плане: {experiments.length - 1}{' '}
          {experiments.length - 1 >= 6 ? (
            <>— требование ТЗ выполнено <Check className="inline size-4 -translate-y-px" /></>
          ) : (
            <>— нужно минимум 6, добавь параметры <AlertTriangle className="inline size-4 -translate-y-px" /></>
          )}
        </div>

        <div className="mb-4 max-h-96 overflow-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-[12.5px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="border-b border-line">
                <th className="px-3 py-2 font-semibold text-title">#</th>
                <th className="px-3 py-2 font-semibold text-title">Что меняем</th>
                {activeParams.map((p) => (
                  <th key={p.id} className="px-3 py-2 font-semibold text-title">
                    {p.name}
                  </th>
                ))}
                <th className="px-3 py-2 font-semibold text-title">RAGAS</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((e) => (
                <motion.tr
                  key={`${e.n}-${e.change}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`border-b border-line/40 last:border-0 ${e.n === 0 ? 'bg-violet/10' : 'hover:bg-surface-2/50'}`}
                >
                  <td className="px-3 py-2 font-mono text-muted">{e.n}</td>
                  <td className="px-3 py-2 font-medium text-ink">{e.change}</td>
                  {activeParams.map((p) => {
                    const v = e.config[p.id]
                    const changed = v.startsWith('[')
                    return (
                      <td key={p.id} className={`px-3 py-2 font-mono ${changed ? 'font-bold text-accent' : v === 'best' ? 'text-good' : 'text-muted'}`}>
                        {v}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 font-mono text-muted">?</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={copy} className="btn-ghost">
            {copied ? <Check className="size-4 text-good" /> : <Copy className="size-4" />}
            {copied ? 'Скопировано!' : 'Скопировать таблицу как Markdown'}
          </button>
          <span className="text-xs text-muted">Вставь в ноутбук и заполняй метрики по мере экспериментов</span>
        </div>

        <div className="rounded-xl border border-line bg-surface-2/50 p-4 text-[13.5px] leading-relaxed text-ink/80">
          <strong className="text-title">Как читать план:</strong> значение в{' '}
          <span className="font-mono font-bold text-accent">[скобках]</span> — то, что меняется в этом эксперименте;{' '}
          <span className="font-mono font-bold text-good">best</span> — берёшь значение-победителя из предыдущей серии. Меняй{' '}
          <strong className="text-title">один параметр за раз</strong>, прогоняй весь Golden Dataset, записывай все 4 метрики RAGAS и
          пиши вывод: стало лучше или хуже и почему.
        </div>
      </div>
    </div>
  )
}

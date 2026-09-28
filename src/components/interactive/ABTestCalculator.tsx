import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'

const Z = 1.96

/** b — кейсы, где верно только A; c — где верно только B. По умолчанию — лучший для различия случай: все расхождения в одну сторону */
const PRESETS = [
  { name: '28/33 vs 29/33 (два одинаковых прогона)', a: 'прогон 1', b: 'прогон 2', k1: 28, n1: 33, k2: 29, n2: 33, onlyA: 0, onlyB: 1 },
  { name: 'ретест H1 14/15 vs H0 11/15', a: 'H1', b: 'H0', k1: 14, n1: 15, k2: 11, n2: 15, onlyA: 3, onlyB: 0 },
  { name: 'nano 22/33 vs mini 28/33', a: 'nano', b: 'mini', k1: 22, n1: 33, k2: 28, n2: 33, onlyA: 0, onlyB: 6 },
] as const

function wilson(k: number, n: number) {
  const p = k / n
  const den = 1 + (Z * Z) / n
  const center = (p + (Z * Z) / (2 * n)) / den
  const half = (Z * Math.sqrt((p * (1 - p)) / n + (Z * Z) / (4 * n * n))) / den
  return { p, lo: Math.max(0, center - half), hi: Math.min(1, center + half) }
}

function binom(n: number, k: number) {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return r
}

/** Точный двусторонний тест McNemar: считаются только расходящиеся пары */
function mcnemarP(b: number, c: number) {
  const n = b + c
  if (n === 0) return 1
  let s = 0
  for (let i = 0; i <= Math.min(b, c); i++) s += binom(n, i)
  return Math.min(1, (2 * s) / 2 ** n)
}

const pct = (v: number) => `${(v * 100).toFixed(0)}%`
const pp = (v: number) => (v * 100).toFixed(1).replace('.', ',').replace('-', '−')
const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)))

function NumField({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-muted">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(clampInt(Number(e.target.value), 0, max))}
        className="min-h-11 w-full rounded-lg border border-line bg-bg/60 px-2 font-mono text-[15px] text-title"
      />
    </label>
  )
}

export function ABTestCalculator() {
  const [preset, setPreset] = useState(0)
  const [v, setV] = useState({ k1: 28, n1: 33, k2: 29, n2: 33, onlyA: 0, onlyB: 1 })
  const names = PRESETS[preset] ?? PRESETS[0]

  const pick = (i: number) => {
    const p = PRESETS[i]
    setPreset(i)
    setV({ k1: p.k1, n1: p.n1, k2: p.k2, n2: p.n2, onlyA: p.onlyA, onlyB: p.onlyB })
  }
  const set = (key: keyof typeof v) => (x: number) =>
    setV((s) => {
      const next = { ...s, [key]: x }
      next.n1 = Math.max(1, next.n1)
      next.n2 = Math.max(1, next.n2)
      next.k1 = Math.min(next.k1, next.n1)
      next.k2 = Math.min(next.k2, next.n2)
      return next
    })

  const r = useMemo(() => {
    const A = wilson(v.k1, v.n1)
    const B = wilson(v.k2, v.n2)
    const d = A.p - B.p
    const lo = d - Math.sqrt((A.p - A.lo) ** 2 + (B.hi - B.p) ** 2)
    const hi = d + Math.sqrt((A.hi - A.p) ** 2 + (B.p - B.lo) ** 2)
    return { A, B, d, lo, hi, noise: lo <= 0 && hi >= 0, p: mcnemarP(v.onlyA, v.onlyB) }
  }, [v])

  /** ось разницы: −60…+60 п.п. → 0…100 (% ширины) */
  const dx = (x: number) => ((Math.max(-0.6, Math.min(0.6, x)) + 0.6) / 1.2) * 100

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <Scale className="size-4 text-accent" /> Калькулятор A/B: различима ли разница
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => pick(i)}
              className={`min-h-11 rounded-xl border px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${
                i === preset ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumField label={`A (${names.a}): успехов`} value={v.k1} onChange={set('k1')} max={1000} />
          <NumField label="A: из n" value={v.n1} onChange={set('n1')} max={1000} />
          <NumField label={`B (${names.b}): успехов`} value={v.k2} onChange={set('k2')} max={1000} />
          <NumField label="B: из n" value={v.n2} onChange={set('n2')} max={1000} />
        </div>

        <div className="mb-1 text-[12px] font-semibold text-muted">95% интервал Уилсона для каждой доли</div>
        <div className="space-y-3">
          {[
            { label: `A ${v.k1}/${v.n1}`, w: r.A, color: 'var(--color-accent)' },
            { label: `B ${v.k2}/${v.n2}`, w: r.B, color: 'var(--color-violet)' },
          ].map(({ label, w, color }) => (
            <div key={label}>
              <div className="mb-1 flex flex-wrap justify-between gap-x-3 font-mono text-[12.5px]">
                <span className="text-title">{label} = {pct(w.p)}</span>
                <span className="text-muted">[{pct(w.lo)}; {pct(w.hi)}]</span>
              </div>
              <div className="relative h-5 rounded-full bg-bg">
                <motion.div
                  className="absolute inset-y-1 rounded-full opacity-40"
                  animate={{ left: `${w.lo * 100}%`, width: `${(w.hi - w.lo) * 100}%` }}
                  style={{ background: color }}
                />
                <motion.div className="absolute inset-y-0 w-1 rounded-full" animate={{ left: `${w.p * 100}%` }} style={{ background: color, marginLeft: -2 }} />
              </div>
            </div>
          ))}
          <div className="flex justify-between font-mono text-[10.5px] text-muted">
            {['0%', '25%', '50%', '75%', '100%'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-5 mb-1 text-[12px] font-semibold text-muted">Разница A − B и её 95% интервал (Newcombe, hybrid score)</div>
        <div className="relative h-6 rounded-full bg-bg">
          <div className="absolute inset-y-0 w-px bg-muted/60" style={{ left: '50%' }} />
          <motion.div
            className={`absolute inset-y-1.5 rounded-full ${r.noise ? 'bg-warn/50' : 'bg-good/50'}`}
            animate={{ left: `${dx(r.lo)}%`, width: `${dx(r.hi) - dx(r.lo)}%` }}
          />
          <motion.div className="absolute inset-y-0 w-1 rounded-full bg-title" animate={{ left: `${dx(r.d)}%` }} style={{ marginLeft: -2 }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10.5px] text-muted">
          <span>−60 п.п.</span>
          <span>0</span>
          <span>+60 п.п.</span>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${r.noise ? 'border-warn/40 bg-warn/5' : 'border-good/40 bg-good/5'}`}>
          <div className="font-mono text-[13px] text-ink">
            d = {pp(r.d)} п.п., 95% CI [{pp(r.lo)}; {pp(r.hi)}]
          </div>
          <div className={`mt-1 font-semibold ${r.noise ? 'text-warn' : 'text-good'}`}>
            {r.noise ? 'Интервал содержит 0 — разница в пределах шума' : 'Интервал не содержит 0 — различимо'}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4">
          <div className="mb-2 text-[13px] font-semibold text-title">Парное сравнение на одних и тех же кейсах: McNemar</div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="верно только у A (b)" value={v.onlyA} onChange={set('onlyA')} max={500} />
            <NumField label="верно только у B (c)" value={v.onlyB} onChange={set('onlyB')} max={500} />
          </div>
          <div className="mt-2 font-mono text-[13px] text-ink">
            точный p = {r.p < 0.001 ? '< 0,001' : r.p.toFixed(3).replace('.', ',')} →{' '}
            <span className={r.p < 0.05 ? 'text-good' : 'text-warn'}>{r.p < 0.05 ? 'различимо (p < 0,05)' : 'не различимо'}</span>
          </div>
        </div>

        <div className="mt-4 text-[13.5px] leading-relaxed text-muted">
          Интервалы выше считают A и B независимыми выборками. Если обе конфигурации прогнаны на одних и тех же кейсах,
          корректнее тест McNemar: кейсы, где обе правы или обе ошиблись, информации о разнице не несут, считаются только
          расходящиеся пары b и c. В пресетах b и c — лучший для различия случай (все расхождения в одну сторону); настоящие
          пары бери из JSON-отчётов прогонов.
        </div>
      </div>
    </div>
  )
}

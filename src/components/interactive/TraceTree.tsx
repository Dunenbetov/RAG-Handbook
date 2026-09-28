import { useState } from 'react'
import { motion } from 'framer-motion'
import { ListTree } from 'lucide-react'

/** Прайс на 1M токенов (USD), как в apps/api/src/llm/pricing.ts remark-round. Cached input у 4.1 — вчетверо дешевле. */
const PRICE = {
  'gpt-4.1': [2, 8],
  'gpt-4.1-mini': [0.4, 1.6],
  'text-embedding-3-small': [0.02, 0],
} as const

type Kind = 'agent' | 'span' | 'generation' | 'embedding' | 'retriever'

interface Obs {
  name: string
  kind: Kind
  depth: number
  ms: number
  model?: keyof typeof PRICE
  tin?: number
  tout?: number
  cached?: number
  input?: string
  output?: string
  note?: string
  interrupt?: boolean
}

/** Один прогон разбора замечания: корень triage и продолжение triage.resume в том же trace */
const NODES: Obs[] = [
  { name: 'triage', kind: 'agent', depth: 0, ms: 6050, input: 'remark r_0142: «Кнопка „Сохранить“ серая», кадр: есть', output: 'interrupt → ждём решения PM', note: 'Корневой span прогона. traceId = sha256(runId)[:32], sessionId = remarkId, tags [triage].' },
  { name: 'ingest', kind: 'span', depth: 1, ms: 12, output: '{ hasFrame: true, injection: false }' },
  { name: 'retrieve_docs', kind: 'span', depth: 1, ms: 380, note: 'Нода LangGraph: пришла из CallbackHandler.' },
  { name: 'retrieve', kind: 'retriever', depth: 2, ms: 330, input: '{ query, topK: 6 }', output: 'top-6: §2.1 (0,61), §2.3 (0,52), §4.2 (0,47) …', note: 'rag.service.ts: ORDER BY embedding <=> $vec, фильтр projectId в SQL. Эмбеддинг запроса — вложенный span.' },
  { name: 'embed', kind: 'embedding', depth: 3, ms: 240, model: 'text-embedding-3-small', tin: 38, tout: 0, input: 'Кнопка «Сохранить» серая · Профиль компании' },
  { name: 'maybe_vision', kind: 'span', depth: 1, ms: 2270 },
  { name: 'vision', kind: 'generation', depth: 2, ms: 2250, model: 'gpt-4.1-mini', tin: 1392, tout: 54, input: 'system + кадр (вход шага: 1148 токенов на golden, 1755 в среднем на проде)', output: 'Кнопка «Сохранить» серая, все поля заполнены', note: 'Медленный, но дешёвый: картинка + mini.' },
  { name: 'bind_to_clause', kind: 'span', depth: 1, ms: 3, output: 'best 0,61 ≥ BOUND_SCORE 0,45 → classify' },
  { name: 'classify_evidence', kind: 'span', depth: 1, ms: 1370 },
  { name: 'classify', kind: 'generation', depth: 2, ms: 1350, model: 'gpt-4.1-mini', tin: 2840, cached: 1792, tout: 118, input: 'Skill + 6 фрагментов + факты кадра', output: '{ "proposedClass": "defect_candidate", "hitIndexes": [0], … }', note: '1792 токена префикса (Skill + system) OpenAI взял из prompt cache.' },
  { name: 'draft_rationale', kind: 'span', depth: 1, ms: 1930 },
  { name: 'draft', kind: 'generation', depth: 2, ms: 1900, model: 'gpt-4.1', tin: 960, tout: 81, input: 'класс + цитата §2.1 + факты кадра (stream)', output: 'По §2.1 primary-кнопка синяя при заполненных полях, на кадре она серая…', note: 'Единственный вызов gpt-4.1: больше половины цены прогона.' },
  { name: 'faithfulness_gate', kind: 'span', depth: 1, ms: 2, output: 'ok: ссылки только на процитированные §, кадр есть', note: 'Проверка кодом, без LLM.' },
  { name: 'propose', kind: 'span', depth: 1, ms: 21, output: 'applyProposal → awaiting_pm' },
  { name: 'hitl', kind: 'span', depth: 1, ms: 6, interrupt: true, output: 'GraphInterrupt', note: 'В Langfuse span красный: это пауза interrupt(), а не сбой.' },
  { name: 'triage.resume', kind: 'agent', depth: 0, ms: 64, input: 'решение PM «Дефект» через 2 ч 14 мин', note: 'Другой HTTP-запрос, но тот же traceId из runId: новый корневой span в том же trace.' },
  { name: 'hitl', kind: 'span', depth: 1, ms: 9, input: 'Command({ resume: decision })', output: 'interrupt() вернул решение PM', note: 'Нода с interrupt при resume выполняется с начала.' },
  { name: 'persist', kind: 'span', depth: 1, ms: 31, output: 'статус → defect, в работу разработчику' },
]

const KIND_STYLE: Record<Kind, string> = {
  agent: 'bg-violet/15 text-violet',
  span: 'bg-line/60 text-muted',
  generation: 'bg-accent/15 text-accent',
  embedding: 'bg-good/15 text-good',
  retriever: 'bg-good/15 text-good',
}
const KIND_SHORT: Record<Kind, string> = { agent: 'agent', span: 'span', generation: 'gen', embedding: 'emb', retriever: 'retr' }

function cost(o: Obs, withCache = false) {
  if (!o.model) return 0
  const [pin, pout] = PRICE[o.model]
  const cached = withCache ? (o.cached ?? 0) : 0
  return (((o.tin ?? 0) - cached) * pin + (cached * pin) / 4 + (o.tout ?? 0) * pout) / 1e6
}

const isLeaf = (i: number) => i === NODES.length - 1 || NODES[i + 1].depth <= NODES[i].depth
function argmax(f: (o: Obs) => number) {
  let best = -1
  NODES.forEach((n, i) => {
    if (isLeaf(i) && (best < 0 || f(n) > f(NODES[best]))) best = i
  })
  return best
}
const HOT = { cost: argmax((o) => cost(o)), latency: argmax((o) => o.ms) }
const TOTAL = NODES.reduce((s, o) => s + cost(o), 0)
const TOTAL_CACHED = NODES.reduce((s, o) => s + cost(o, true), 0)
const ACTIVE_MS = NODES.filter((o) => o.depth === 0).reduce((s, o) => s + o.ms, 0)
const TIN = NODES.reduce((s, o) => s + (o.tin ?? 0), 0)
const TOUT = NODES.reduce((s, o) => s + (o.tout ?? 0), 0)
const MAX_MS = Math.max(...NODES.map((o) => o.ms))

const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2).replace('.', ',')} с` : `${ms} мс`)
const fmtUsd = (v: number) => (v === 0 ? '—' : v < 0.00001 ? '< $0,00001' : `$${v.toFixed(5).replace('.', ',')}`)

export function TraceTree() {
  const [sel, setSel] = useState(NODES.findIndex((n) => n.name === 'classify'))
  const [mode, setMode] = useState<keyof typeof HOT | null>(null)
  const hot = mode ? HOT[mode] : -1
  const s = NODES[sel]

  const toggle = (m: keyof typeof HOT) => {
    const next = mode === m ? null : m
    setMode(next)
    if (next) setSel(HOT[next])
  }

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        <ListTree className="size-4 text-accent" /> Трейс одного разбора замечания (в духе Langfuse)
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(['cost', 'latency'] as const).map((m) => (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`min-h-11 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                mode === m ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'
              }`}
            >
              {m === 'cost' ? 'Подсветить самый дорогой' : 'Подсветить самый медленный'}
            </button>
          ))}
        </div>
        <div className="mb-3 break-words font-mono text-[11.5px] text-muted">
          trace 5be0…c21e · session r_0142 · user pm_01 · tags [triage]
        </div>

        <div className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
          <div className="space-y-1">
            {NODES.map((n, i) => (
              <button
                key={i}
                onClick={() => setSel(i)}
                style={{ paddingLeft: 10 + n.depth * 14 }}
                className={`block min-h-11 w-full rounded-lg border py-1.5 pr-2.5 text-left transition-colors ${
                  i === hot ? 'border-bad/60 bg-bad/10' : i === sel ? 'border-accent bg-accent/10' : 'border-line/60 bg-surface-2/40 hover:border-line'
                } ${n.depth === 0 && i > 0 ? 'mt-3' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${KIND_STYLE[n.kind]}`}>{KIND_SHORT[n.kind]}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-title">{n.name}</span>
                  {n.interrupt && <span className="shrink-0 rounded bg-warn/15 px-1.5 py-0.5 text-[10px] text-warn">interrupt</span>}
                  <span className="shrink-0 font-mono text-[11.5px] text-muted">{fmtMs(n.ms)}</span>
                </span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-bg">
                  <motion.span
                    className="block h-full rounded-full"
                    animate={{ width: `${Math.max(1, (n.ms / MAX_MS) * 100)}%` }}
                    style={{ background: n.model ? 'var(--color-accent)' : n.interrupt ? 'var(--color-warn)' : 'var(--color-muted)' }}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-line bg-surface-2/60 p-4 md:sticky md:top-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold text-title">{s.name}</span>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${KIND_STYLE[s.kind]}`}>{s.kind}</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[12.5px]">
              <dt className="text-muted">latency</dt>
              <dd className="text-ink">{fmtMs(s.ms)}</dd>
              {s.model && (
                <>
                  <dt className="text-muted">model</dt>
                  <dd className="break-all text-ink">{s.model}</dd>
                  <dt className="text-muted">usage</dt>
                  <dd className="text-ink">
                    {s.tin} in / {s.tout} out{s.cached ? ` (cached ${s.cached})` : ''}
                  </dd>
                  <dt className="text-muted">cost</dt>
                  <dd className="text-ink">
                    {fmtUsd(cost(s))}
                    {s.cached ? ` → ${fmtUsd(cost(s, true))} с cache` : ''}
                  </dd>
                </>
              )}
            </dl>
            {[
              ['input', s.input],
              ['output', s.output],
            ].map(([label, text]) =>
              text ? (
                <div key={label} className="mt-2 rounded-lg border border-accent/20 bg-bg/60 px-3 py-2 font-mono text-[12px] break-words text-accent/90">
                  <span className="text-muted">{label}: </span>
                  {text}
                </div>
              ) : null,
            )}
            {s.note && <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.note}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['Cost по прайсу', fmtUsd(TOTAL)],
            ['С prompt cache', `${fmtUsd(TOTAL_CACHED)} (−${Math.round((1 - TOTAL_CACHED / TOTAL) * 100)}%)`],
            ['Активное время', fmtMs(ACTIVE_MS)],
            ['Токены in / out', `${TIN} / ${TOUT}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-line bg-bg/60 p-3">
              <div className="text-[11.5px] text-muted">{k}</div>
              <div className="font-mono text-[14px] font-bold text-title">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[13.5px] leading-relaxed text-muted">
          Цифры иллюстративные, но согласованы с замерами проекта: на проде разбор стоит около $0,0048 и идёт 6,7 с p50.
          Пауза между <code>hitl</code> и <code>triage.resume</code> в latency не входит: граф в это время не работает, а
          состояние лежит в чекпоинтере. Дорогой шаг и медленный шаг — разные вещи: цену делает модель, время — картинка и
          длина ответа.
        </div>
      </div>
    </div>
  )
}

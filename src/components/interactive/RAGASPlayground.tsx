import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bomb, Check, Microscope, Trash2, X } from 'lucide-react'

type MetricId = 'faithfulness' | 'relevancy' | 'recall' | 'precision'

const CLAIMS = [
  { text: 'Базовая ставка составляет 14,25% годовых', supported: true },
  { text: 'ставка установлена Национальным банком', supported: true },
  { text: 'она используется для сдерживания инфляции', supported: false },
]

const REF_CLAIMS = [
  { text: 'Ставка равна 14,25%', found: true },
  { text: 'Решение принято в январе 2025', found: false },
]

const CONTEXTS_GOOD = [
  { text: 'Национальный банк Казахстана установил базовую ставку на уровне 14,25% годовых.', relevant: true },
  { text: 'Базовая ставка — ключевой инструмент денежно-кредитной политики.', relevant: true },
  { text: 'Казахстан занимает 9-е место в мире по площади территории.', relevant: false },
]

const METRICS: Record<
  MetricId,
  { name: string; target: 'Генерация'; color: string; question: string; how: string } | { name: string; target: 'Поиск'; color: string; question: string; how: string }
> = {
  faithfulness: {
    name: 'Faithfulness',
    target: 'Генерация',
    color: '#34d399',
    question: 'Все ли утверждения ответа подтверждены контекстом?',
    how: 'LLM-судья разбивает ответ на утверждения (claims) и проверяет каждое: есть ли оно в контексте. Ниже — какие claims подтвердились.',
  },
  relevancy: {
    name: 'Answer Relevancy',
    target: 'Генерация',
    color: '#22d3ee',
    question: 'Отвечает ли ответ именно на заданный вопрос?',
    how: 'Судья генерирует из ответа вопросы, на которые тот отвечает, и сравнивает их эмбеддинги с исходным вопросом.',
  },
  recall: {
    name: 'Context Recall',
    target: 'Поиск',
    color: '#8b5cf6',
    question: 'Все ли факты эталонного ответа найдены поиском?',
    how: 'Судья разбивает эталон (reference) на факты и проверяет, покрыты ли они найденными чанками. Ниже — что нашлось.',
  },
  precision: {
    name: 'Context Precision',
    target: 'Поиск',
    color: '#fbbf24',
    question: 'Релевантны ли найденные чанки (нет ли мусора)?',
    how: 'Судья оценивает каждый найденный чанк: полезен ли он для ответа. Мусор в контексте снижает метрику — особенно если стоит высоко.',
  },
}

export function RAGASPlayground() {
  const [metric, setMetric] = useState<MetricId>('faithfulness')
  const [spoiled, setSpoiled] = useState(false)

  const m = METRICS[metric]

  // «испорченный» режим: retriever вернул мусор
  const contexts = spoiled
    ? [CONTEXTS_GOOD[2], { text: 'Наурыз — главный весенний праздник, отмечается 22 марта.', relevant: false }, CONTEXTS_GOOD[0]]
    : CONTEXTS_GOOD

  const scores: Record<MetricId, number> = spoiled
    ? { faithfulness: 0.33, relevancy: 0.61, recall: 0.5, precision: 0.28 }
    : { faithfulness: 0.67, relevancy: 0.9, recall: 0.5, precision: 0.83 }

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-white">
        <Microscope className="size-4 text-accent" /> RAGAS-плейграунд — посмотри, как судья считает каждую метрику
      </div>
      <div className="p-5">
        {/* пример */}
        <div className="mb-4 space-y-2 text-[13.5px]">
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <span className="mr-2 text-[11px] font-bold uppercase text-violet">Вопрос</span>
            Какой сейчас размер базовой ставки в Казахстане?
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <span className="mr-2 text-[11px] font-bold uppercase text-accent">Контекст (нашёл retriever)</span>
            <div className="mt-1.5 space-y-1.5">
              <AnimatePresence mode="popLayout">
                {contexts.map((c) => (
                  <motion.div
                    key={c.text}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] ${
                      metric === 'precision'
                        ? c.relevant
                          ? 'border-good/50 bg-good/10'
                          : 'border-bad/50 bg-bad/10'
                        : 'border-line/60 bg-bg/40'
                    }`}
                  >
                    {metric === 'precision' && (
                      <span className="mr-1.5 inline-block align-middle">
                        {c.relevant ? <Check className="size-3.5 text-good" /> : <Trash2 className="size-3.5 text-bad" />}
                      </span>
                    )}
                    {c.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <span className="mr-2 text-[11px] font-bold uppercase text-good">Ответ LLM</span>
            {metric === 'faithfulness' ? (
              <span>
                {CLAIMS.map((c, i) => (
                  <motion.mark
                    key={i}
                    initial={{ backgroundColor: 'transparent' }}
                    animate={{ backgroundColor: c.supported ? 'rgba(52,211,153,0.22)' : 'rgba(248,113,113,0.25)' }}
                    transition={{ delay: i * 0.25 }}
                    className="rounded px-0.5 text-ink"
                  >
                    {c.text}
                    {i < CLAIMS.length - 1 ? ', ' : '.'}
                  </motion.mark>
                ))}
              </span>
            ) : (
              <span>Базовая ставка составляет 14,25% годовых, установлена Национальным банком, используется для сдерживания инфляции.</span>
            )}
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <span className="mr-2 text-[11px] font-bold uppercase text-warn">Эталон (golden dataset)</span>
            Базовая ставка составляет 14,25% годовых (решение января 2025 года).
          </div>
        </div>

        {/* выбор метрики */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(METRICS) as MetricId[]).map((id) => {
            const mm = METRICS[id]
            const active = id === metric
            return (
              <button
                key={id}
                onClick={() => setMetric(id)}
                className={`rounded-xl border p-2.5 text-center transition-all ${active ? 'bg-surface-2' : 'border-line bg-surface-2/40 opacity-60 hover:opacity-100'}`}
                style={{ borderColor: active ? mm.color : undefined }}
              >
                <motion.div key={`${id}-${spoiled}`} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-mono text-xl font-bold" style={{ color: mm.color }}>
                  {scores[id].toFixed(2)}
                </motion.div>
                <div className="text-[10.5px] font-semibold text-ink">{mm.name}</div>
                <div className="text-[9.5px] text-muted">{mm.target}</div>
              </button>
            )
          })}
        </div>

        {/* объяснение метрики */}
        <AnimatePresence mode="wait">
          <motion.div
            key={metric + String(spoiled)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-xl border border-line bg-surface-2/50 p-4"
          >
            <div className="mb-1 font-semibold text-white" style={{ color: m.color }}>
              {m.name}: {m.question}
            </div>
            <p className="mb-2.5 text-[13.5px] leading-relaxed text-ink/80">{m.how}</p>

            {metric === 'faithfulness' && (
              <div className="space-y-1.5">
                {CLAIMS.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px]">
                    <span className="mt-0.5 shrink-0">{c.supported ? <Check className="size-4 text-good" /> : <X className="size-4 text-bad" />}</span>
                    <span className={c.supported ? 'text-ink/85' : 'text-bad'}>
                      «{c.text}» — {c.supported ? 'есть в контексте' : 'в контексте этого НЕТ: модель додумала (галлюцинация)'}
                    </span>
                  </div>
                ))}
                <div className="pt-1 font-mono text-[12.5px] text-muted">
                  Faithfulness = 2 подтверждено / 3 всего = <span className="font-bold text-white">0.67</span>
                </div>
              </div>
            )}
            {metric === 'recall' && (
              <div className="space-y-1.5">
                {REF_CLAIMS.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px]">
                    <span className="mt-0.5 shrink-0">{c.found ? <Check className="size-4 text-good" /> : <X className="size-4 text-bad" />}</span>
                    <span className={c.found ? 'text-ink/85' : 'text-bad'}>
                      «{c.text}» — {c.found ? 'найдено в контексте' : 'retriever это НЕ нашёл'}
                    </span>
                  </div>
                ))}
                <div className="pt-1 font-mono text-[12.5px] text-muted">
                  Context Recall = 1 найдено / 2 факта эталона = <span className="font-bold text-white">0.50</span>
                </div>
              </div>
            )}
            {metric === 'precision' && (
              <div className="font-mono text-[12.5px] text-muted">
                {spoiled
                  ? 'Релевантный чанк упал на 3-е место, топ занят мусором → precision@1 = 0, precision@2 = 0 → метрика рушится.'
                  : 'Релевантные чанки стоят на 1-м и 2-м местах, мусор — ниже → метрика высокая.'}{' '}
                Context Precision = <span className="font-bold text-white">{scores.precision.toFixed(2)}</span>
              </div>
            )}
            {metric === 'relevancy' && (
              <div className="text-[12.5px] leading-relaxed text-muted">
                Из ответа судья сгенерирует вопросы вроде «какова базовая ставка в РК?» (близко к исходному → высокий скор) и «зачем нужна
                базовая ставка?» (дальше от исходного → скор ниже). Среднее сходство ={' '}
                <span className="font-mono font-bold text-white">{scores.relevancy.toFixed(2)}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* тумблер порчи контекста */}
        <button
          onClick={() => setSpoiled((v) => !v)}
          className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
            spoiled ? 'border-bad/60 bg-bad/10 text-bad' : 'border-line bg-surface-2 text-ink hover:border-bad/50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Bomb className="size-4" />
            {spoiled ? 'Retriever сломан: вернул мусор — верни как было' : 'Испортить retrieval (подсунуть нерелевантные чанки)'}
          </span>
        </button>
        {spoiled && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-[13px] leading-relaxed text-muted">
            Смотри, как просели метрики: сильнее всего — <strong className="text-warn">Context Precision</strong> (мусор в топе выдачи) и{' '}
            <strong className="text-good">Faithfulness</strong> (без нужного контекста модель начинает выдумывать). Так по «профилю падения»
            метрик диагностируют, какой этап пайплайна чинить.
          </motion.p>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, HelpCircle, Layers, RotateCcw } from 'lucide-react'

const PARENT_TEXT = {
  before: 'Финансовые результаты за отчётный период. Ключевые показатели сегмента грузовых перевозок демонстрируют устойчивый рост. ',
  hit: 'Доходы от грузовых перевозок составили 1 875,6 млрд тенге, увеличившись на 11,5% по сравнению с 2023 годом.',
  after: ' Рост обусловлен увеличением объёмов транзита и индексацией тарифов. В 2023 году аналогичный показатель составлял 1 682,6 млрд тенге.',
}

const OTHER_CHILDREN = [
  'Ключевые показатели сегмента грузовых перевозок демонстрируют…',
  'Рост обусловлен увеличением объёмов транзита и индексацией…',
]

export function ParentChildDemo() {
  const [phase, setPhase] = useState(0) // 0: запрос, 1: найден ребёнок, 2: раскрыт родитель, 3: ответ

  const next = () => setPhase((p) => Math.min(p + 1, 3))
  const reset = () => setPhase(0)

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <Layers className="size-4 text-accent" /> Parent-Child: ищем мелко — читаем крупно
        </span>
        <button onClick={reset} className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:border-accent/60">
          <RotateCcw className="size-4" />
        </button>
      </div>
      <div className="p-5">
        {/* запрос */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-violet/50 bg-violet/10 px-4 py-2.5 text-[14px] font-medium text-white">
            <HelpCircle className="size-4 shrink-0 text-violet" /> «Какой доход от грузовых перевозок в 2024?»
          </div>
          {phase === 0 && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={next} className="btn-primary py-2 text-sm">
              Искать →
            </motion.button>
          )}
        </div>

        {/* дети */}
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
          Векторный индекс: мелкие чанки-«дети» (400 символов)
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <motion.div
            animate={{
              borderColor: phase >= 1 ? '#34d399' : '#1e2749',
              scale: phase === 1 ? 1.03 : 1,
              boxShadow: phase >= 1 ? '0 0 24px rgba(52,211,153,0.25)' : '0 0 0 rgba(0,0,0,0)',
            }}
            className="rounded-xl border bg-surface-2 p-3 text-[12px] leading-snug text-ink/85"
          >
            {phase >= 1 && <div className="mb-1 text-[10px] font-bold text-good">✓ НАЙДЕН · cos_sim 0.91</div>}
            «Доходы от грузовых перевозок составили 1 875,6 млрд тенге…»
          </motion.div>
          {OTHER_CHILDREN.map((c) => (
            <div key={c} className={`rounded-xl border border-line bg-surface-2 p-3 text-[12px] leading-snug text-muted transition-opacity ${phase >= 1 ? 'opacity-40' : ''}`}>
              «{c}»
            </div>
          ))}
        </div>

        {phase === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-center">
            <button onClick={next} className="btn-primary py-2 text-sm">
              Раскрыть родителя ↓
            </button>
          </motion.div>
        )}

        {/* родитель */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet">
                Docstore: крупный чанк-«родитель» (2000 символов) — его получает LLM
              </div>
              <div className="mb-4 rounded-xl border border-violet/40 bg-violet/5 p-4 text-[13px] leading-relaxed">
                <span className="text-ink/70">{PARENT_TEXT.before}</span>
                <mark className="rounded bg-good/25 px-1 py-0.5 text-white">{PARENT_TEXT.hit}</mark>
                <span className="text-ink/70">{PARENT_TEXT.after}</span>
              </div>
              {phase === 2 && (
                <div className="mb-4 text-center">
                  <button onClick={next} className="btn-primary py-2 text-sm">
                    Сгенерировать ответ →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ответ */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-good/40 bg-good/5 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-good">
                <Bot className="size-3.5" /> Ответ LLM
              </div>
              <p className="text-[14px] leading-relaxed text-ink/90">
                Доходы КТЖ от грузовых перевозок в 2024 году составили <strong className="text-white">1 875,6 млрд тенге</strong> — на{' '}
                <strong className="text-white">11,5% больше</strong>, чем в 2023 году (1 682,6 млрд тенге).
              </p>
              <p className="mt-2.5 text-[12.5px] text-muted">
                Модель увидела не только найденную строчку, но и весь родительский блок — поэтому смогла сравнить с 2023 годом и не
                перепутала цифры. Мелкий чанк дал точность поиска, крупный — полноту контекста.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

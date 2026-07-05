import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, Trophy, X } from 'lucide-react'

export interface QuizQuestion {
  q: string
  options: string[]
  /** индекс правильного варианта */
  answer: number
  explain: string
}

const STORAGE_PREFIX = 'rag-conspect-quiz-'

export function QuizBlock({ id, questions }: { id: string; questions: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const best = useMemo(() => {
    try {
      return Number(localStorage.getItem(STORAGE_PREFIX + id) ?? 0)
    } catch {
      return 0
    }
  }, [id])

  const question = questions[current]

  const pick = (idx: number) => {
    if (picked !== null) return
    setPicked(idx)
    if (idx === question.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (current + 1 >= questions.length) {
      const final = score
      try {
        if (final > best) localStorage.setItem(STORAGE_PREFIX + id, String(final))
      } catch {
        // localStorage недоступен
      }
      setFinished(true)
    } else {
      setCurrent((c) => c + 1)
      setPicked(null)
    }
  }

  const restart = () => {
    setCurrent(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
        <Trophy className={`mx-auto mb-4 size-12 ${pct >= 80 ? 'text-warn' : 'text-muted'}`} />
        <div className="mb-1 text-3xl font-bold text-white">
          {score} из {questions.length}
        </div>
        <div className="mb-4 text-muted">
          {pct >= 80
            ? 'Отлично! Тема усвоена — двигайся дальше.'
            : pct >= 50
              ? 'Неплохо, но пройдись по уроку ещё раз — слабые места остались.'
              : 'Стоит перечитать главу: база важнее скорости.'}
        </div>
        <div className="mx-auto mb-6 h-2.5 w-64 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${pct >= 80 ? 'bg-good' : pct >= 50 ? 'bg-warn' : 'bg-bad'}`}
          />
        </div>
        <button onClick={restart} className="btn-ghost">
          <RotateCcw className="size-4" /> Пройти ещё раз
        </button>
      </motion.div>
    )
  }

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between text-sm text-muted">
        <span>
          Вопрос {current + 1} / {questions.length}
        </span>
        <span>
          Счёт: <span className="font-semibold text-accent">{score}</span>
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          animate={{ width: `${(current / questions.length) * 100}%` }}
          className="h-full rounded-full bg-gradient-to-r from-accent to-violet"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="my-5 text-lg font-semibold leading-snug text-white">{question.q}</h3>
          <div className="space-y-2.5">
            {question.options.map((opt, idx) => {
              const isCorrect = idx === question.answer
              const isPicked = idx === picked
              const revealed = picked !== null
              return (
                <button
                  key={idx}
                  onClick={() => pick(idx)}
                  disabled={revealed}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-[15px] transition-all ${
                    revealed
                      ? isCorrect
                        ? 'border-good/60 bg-good/10 text-white'
                        : isPicked
                          ? 'border-bad/60 bg-bad/10 text-ink/80'
                          : 'border-line bg-surface-2/40 text-muted'
                      : 'border-line bg-surface-2/60 text-ink/90 hover:border-violet/60 hover:bg-surface-2'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      revealed && isCorrect
                        ? 'border-good bg-good text-bg'
                        : revealed && isPicked
                          ? 'border-bad bg-bad text-bg'
                          : 'border-muted/50 text-muted'
                    }`}
                  >
                    {revealed && isCorrect ? <Check className="size-3.5" /> : revealed && isPicked ? <X className="size-3.5" /> : String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {picked !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className={`mt-4 rounded-xl border p-4 text-[14.5px] leading-relaxed ${picked === question.answer ? 'border-good/40 bg-good/5' : 'border-warn/40 bg-warn/5'}`}>
                  <span className="font-semibold text-white">{picked === question.answer ? 'Верно! ' : 'Не совсем. '}</span>
                  <span className="text-ink/85">{question.explain}</span>
                </div>
                <button onClick={next} className="btn-primary mt-4">
                  {current + 1 >= questions.length ? 'Показать результат' : 'Следующий вопрос'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

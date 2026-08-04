import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDown,
  ArrowRight,
  Binary,
  Bot,
  ClipboardList,
  Database,
  FileText,
  HelpCircle,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Scissors,
  StepForward,
  Target,
} from 'lucide-react'

interface Stage {
  icon: LucideIcon
  title: string
  phase: 'index' | 'query'
  detail: string
  example: string
}

const STAGES: Stage[] = [
  {
    icon: FileText,
    title: 'Документы',
    phase: 'index',
    detail: 'Собираем базу знаний: PDF-отчёты, статьи законов, внутренние документы. Это то, чего LLM не знает.',
    example: 'Годовой отчёт КТЖ на 368 страниц, Трудовой кодекс РК',
  },
  {
    icon: Scissors,
    title: 'Chunking',
    phase: 'index',
    detail: 'Режем документы на куски (чанки) — целиком они не влезут в контекст модели и будут плохо искаться.',
    example: 'Отчёт → 900 чанков по 1024 токена с overlap 200',
  },
  {
    icon: Binary,
    title: 'Embedding',
    phase: 'index',
    detail: 'Каждый чанк превращаем в вектор — массив чисел, кодирующий смысл. Похожие тексты → похожие векторы.',
    example: '«Доход вырос на 11,5%» → [0.12, −0.87, 0.44, …] (1024 числа)',
  },
  {
    icon: Database,
    title: 'Vector DB',
    phase: 'index',
    detail: 'Складываем векторы в специальную базу, которая умеет мгновенно находить ближайшие. Индексация готова!',
    example: 'ChromaDB с HNSW-индексом: поиск по миллиону векторов за миллисекунды',
  },
  {
    icon: HelpCircle,
    title: 'Вопрос',
    phase: 'query',
    detail: 'Пользователь задаёт вопрос. Начинается «онлайн»-фаза: она выполняется при каждом запросе.',
    example: '«Каков был доход КТЖ от грузовых перевозок в 2024 году?»',
  },
  {
    icon: Target,
    title: 'Retrieval',
    phase: 'query',
    detail: 'Вопрос тоже превращается в вектор, и база возвращает top-k ближайших чанков — кандидатов на ответ.',
    example: 'Top-5 чанков, среди них: «Доходы от грузовых перевозок составили 1 875,6 млрд тенге…»',
  },
  {
    icon: ClipboardList,
    title: 'Промпт',
    phase: 'query',
    detail: 'Собираем промпт: инструкция + найденные чанки (контекст) + вопрос. Модель получает «шпаргалку».',
    example: '«Отвечай ТОЛЬКО по контексту. Контекст: [чанк 1] [чанк 2]… Вопрос: …»',
  },
  {
    icon: Bot,
    title: 'LLM → Ответ',
    phase: 'query',
    detail: 'LLM читает контекст и формулирует ответ, опираясь на реальные документы, а не на «память».',
    example: '«Доходы от грузовых перевозок КТЖ в 2024 году составили 1 875,6 млрд тенге (+11,5%)»',
  },
]

export function RAGPipelineFlow() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= STAGES.length - 1) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, 2600)
    return () => clearInterval(t)
  }, [playing])

  const stage = STAGES[step]

  const StageCard = ({ s, i }: { s: Stage; i: number }) => {
    const active = i === step
    const passed = i < step
    return (
      <button
        onClick={() => {
          setStep(i)
          setPlaying(false)
        }}
        className={`relative flex min-w-[72px] flex-1 flex-col items-center rounded-xl border px-1.5 py-2.5 transition-all ${
          active
            ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
            : passed
              ? 'border-good/40 bg-good/5'
              : 'border-line bg-surface-2 opacity-60 hover:opacity-100'
        }`}
      >
        <motion.span animate={{ scale: active ? 1.25 : 1 }} className="mb-1">
          <s.icon className={`size-5 ${active ? 'text-accent' : passed ? 'text-good' : 'text-muted'}`} />
        </motion.span>
        <span className={`text-center text-[10px] font-semibold leading-tight ${active ? 'text-title' : 'text-muted'}`}>
          {s.title}
        </span>
        {active && (
          <motion.span
            layoutId="pipeline-dot"
            className="absolute -top-1.5 size-3 rounded-full bg-accent shadow-[0_0_12px_#22d3ee]"
          />
        )}
      </button>
    )
  }

  const indexStages = STAGES.filter((s) => s.phase === 'index')
  const queryStages = STAGES.filter((s) => s.phase === 'query')

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Repeat className="size-4 text-accent" /> RAG-пайплайн в движении
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface text-accent transition-colors hover:border-accent/60"
            title={playing ? 'Пауза' : 'Автопроигрывание'}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            onClick={() => {
              setStep((s) => Math.min(s + 1, STAGES.length - 1))
              setPlaying(false)
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink transition-colors hover:border-accent/60"
            title="Следующий шаг"
          >
            <StepForward className="size-4" />
          </button>
          <button
            onClick={() => {
              setStep(0)
              setPlaying(false)
            }}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-accent/60"
            title="Сначала"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* офлайн-фаза */}
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-violet">
          Фаза 1 · Индексация (офлайн, один раз)
        </div>
        <div className="mb-3 flex items-stretch gap-1.5 overflow-x-auto pb-1">
          {indexStages.map((s, i) => (
            <div key={s.title} className="flex min-w-0 flex-1 items-center gap-1.5">
              <StageCard s={s} i={i} />
              {i < indexStages.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-muted/50" />}
            </div>
          ))}
        </div>

        <div className="mb-3 flex justify-center">
          <ArrowDown className="size-4 text-muted/50" />
        </div>

        {/* онлайн-фаза */}
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
          Фаза 2 · Запрос (онлайн, каждый раз)
        </div>
        <div className="mb-5 flex items-stretch gap-1.5 overflow-x-auto pb-1">
          {queryStages.map((s, i) => (
            <div key={s.title} className="flex min-w-0 flex-1 items-center gap-1.5">
              <StageCard s={s} i={indexStages.length + i} />
              {i < queryStages.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-muted/50" />}
            </div>
          ))}
        </div>

        {/* описание текущего шага */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-line bg-surface-2/60 p-4"
          >
            <div className="mb-1.5 flex items-center gap-2 font-semibold text-title">
              <stage.icon className="size-5 text-accent" />
              Шаг {step + 1}/{STAGES.length}: {stage.title}
            </div>
            <p className="mb-2.5 text-[14.5px] leading-relaxed text-ink/85">{stage.detail}</p>
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 font-mono text-[12.5px] text-accent/90">
              {stage.example}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

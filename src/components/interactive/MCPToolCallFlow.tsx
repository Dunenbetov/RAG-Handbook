import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Cable,
  Pause,
  Play,
  RotateCcw,
  Server,
  StepForward,
  User,
  Wrench,
} from 'lucide-react'

const STAGES = [
  {
    icon: User,
    title: 'Запрос',
    detail: 'Пользователь: «Какая погода в Алматы?» Host получает сообщение и передаёт LLM.',
    example: 'User → Host: "Какая погода в Алматы?"',
  },
  {
    icon: Bot,
    title: 'LLM решает',
    detail: 'Модель видит список tools из MCP-серверов. Решает вызвать get_weather с аргументом city.',
    example: 'tool_call: { name: "get_weather", arguments: { city: "Almaty" } }',
  },
  {
    icon: Cable,
    title: 'Client → Server',
    detail: 'Host через MCP Client отправляет JSON-RPC tools/call на Weather Server (STDIO или HTTP).',
    example: '{ "method": "tools/call", "params": { "name": "get_weather", ... } }',
  },
  {
    icon: Server,
    title: 'Server выполняет',
    detail: 'FastMCP-сервер вызывает Open-Meteo API, возвращает structured content.',
    example: '{ "temperature": 28, "condition": "sunny", "humidity": 35 }',
  },
  {
    icon: Wrench,
    title: 'Результат → LLM',
    detail: 'Tool result попадает обратно в контекст модели как assistant tool message.',
    example: 'tool_result: "28°C, солнечно, влажность 35%"',
  },
  {
    icon: Bot,
    title: 'Финальный ответ',
    detail: 'LLM формулирует человеческий ответ на основе реальных данных, а не галлюцинации.',
    example: '«В Алматы сейчас +28°C, солнечно. Отличная погода для прогулки!»',
  },
]

export function MCPToolCallFlow() {
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
    }, 2400)
    return () => clearInterval(t)
  }, [playing])

  const stage = STAGES[step]

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Wrench className="size-4 text-accent" /> Жизненный цикл tool call
        </span>
        <div className="flex gap-1.5">
          <button onClick={() => setPlaying((p) => !p)} className="rounded-lg border border-line bg-surface p-1.5 text-accent">
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            onClick={() => {
              setStep((s) => Math.min(s + 1, STAGES.length - 1))
              setPlaying(false)
            }}
            className="rounded-lg border border-line bg-surface p-1.5"
          >
            <StepForward className="size-4" />
          </button>
          <button
            onClick={() => {
              setStep(0)
              setPlaying(false)
            }}
            className="rounded-lg border border-line bg-surface p-1.5 text-muted"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-stretch gap-1 overflow-x-auto pb-1">
          {STAGES.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const passed = i < step
            return (
              <div key={s.title} className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  onClick={() => {
                    setStep(i)
                    setPlaying(false)
                  }}
                  className={`flex min-w-[72px] flex-1 flex-col items-center rounded-xl border px-1 py-2 transition-all ${
                    active ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20' : passed ? 'border-good/40 bg-good/5' : 'border-line bg-surface-2 opacity-60'
                  }`}
                >
                  <Icon className={`mb-1 size-4 ${active ? 'text-accent' : passed ? 'text-good' : 'text-muted'}`} />
                  <span className="text-center text-[9px] font-semibold leading-tight">{s.title}</span>
                </button>
                {i < STAGES.length - 1 && <ArrowRight className="size-3 shrink-0 text-muted/40" />}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-line bg-surface-2/60 p-4"
          >
            <div className="mb-1.5 font-semibold text-title">
              Шаг {step + 1}/{STAGES.length}: {stage.title}
            </div>
            <p className="mb-2.5 text-[14.5px] leading-relaxed text-ink/85">{stage.detail}</p>
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 font-mono text-[12px] text-accent/90">{stage.example}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

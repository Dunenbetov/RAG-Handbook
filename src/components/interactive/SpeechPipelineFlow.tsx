import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Mic, Pause, Play, RotateCcw, StepForward, Volume2 } from 'lucide-react'

const STAGES = [
  { icon: Mic, title: 'ASR', ms: 800, detail: 'Speech-to-Text: аудио → текст. Whisper API или local Whisper.', example: '"Где поужинать в центре?" → текст для LLM' },
  { icon: Bot, title: 'LLM', ms: 1200, detail: 'Модель обрабатывает текст, вызывает tools, формирует ответ.', example: 'Tool call 2GIS → "Рекомендую Del Papa на Достык..."' },
  { icon: Volume2, title: 'TTS', ms: 900, detail: 'Text-to-Speech: клонированный голос озвучивает ответ.', example: 'MiniMax speech-02 → audio.wav (12 сек)' },
]

export function SpeechPipelineFlow() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [latencyMult, setLatencyMult] = useState(1)

  const totalMs = STAGES.slice(0, step + 1).reduce((s, st) => s + st.ms * latencyMult, 0)

  useEffect(() => {
    if (!playing) return
    const delay = STAGES[step].ms * latencyMult
    const t = setTimeout(() => {
      setStep((s) => {
        if (s >= STAGES.length - 1) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, delay)
    return () => clearTimeout(t)
  }, [playing, step, latencyMult])

  const stage = STAGES[step]

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Mic className="size-4 text-accent" /> ASR → LLM → TTS
        </span>
        <div className="flex gap-1.5">
          <button onClick={() => setPlaying((p) => !p)} className="rounded-lg border border-line bg-surface p-1.5 text-accent">
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button onClick={() => { setStep((s) => Math.min(s + 1, STAGES.length - 1)); setPlaying(false) }} className="rounded-lg border border-line bg-surface p-1.5">
            <StepForward className="size-4" />
          </button>
          <button onClick={() => { setStep(0); setPlaying(false) }} className="rounded-lg border border-line bg-surface p-1.5 text-muted">
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Множитель латентности</span>
            <span className="font-mono text-accent">×{latencyMult.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={latencyMult}
            onChange={(e) => setLatencyMult(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
          />
          <p className="mt-1 text-[11px] text-muted">Cloud ASR быстрее local; TTS HD медленнее Turbo</p>
        </div>

        <div className="mb-4 flex gap-2">
          {STAGES.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const passed = i < step
            return (
              <button
                key={s.title}
                onClick={() => { setStep(i); setPlaying(false) }}
                className={`flex flex-1 flex-col items-center rounded-xl border py-3 transition-all ${
                  active ? 'border-accent bg-accent/10' : passed ? 'border-good/40 bg-good/5' : 'border-line bg-surface-2 opacity-60'
                }`}
              >
                <Icon className={`mb-1 size-5 ${active ? 'text-accent' : passed ? 'text-good' : 'text-muted'}`} />
                <span className="text-xs font-semibold">{s.title}</span>
                <span className="text-[10px] text-muted">~{Math.round(s.ms * latencyMult)} ms</span>
              </button>
            )
          })}
        </div>

        <div className="mb-4 rounded-lg border border-line bg-surface-2/40 px-4 py-2 text-center">
          <span className="text-sm text-muted">Накопленная латентность: </span>
          <span className="font-mono font-bold text-accent">{(totalMs / 1000).toFixed(1)} сек</span>
          <span className="text-sm text-muted"> (без avatar video — ещё +5–30 сек)</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-xl border border-line bg-surface-2/60 p-4">
            <p className="mb-2 text-[14px] leading-relaxed text-ink/85">{stage.detail}</p>
            <div className="font-mono text-[12px] text-accent/90">{stage.example}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

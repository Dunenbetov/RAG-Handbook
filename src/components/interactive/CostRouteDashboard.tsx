import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clapperboard, DollarSign, Film, ImageIcon } from 'lucide-react'

type Mode = 't2v' | 'i2v'
type Tier = 'budget' | 'balanced' | 'premium'

const TIERS: Record<Tier, { label: string; model: string; cost: number; quality: number; latency: string }> = {
  budget: { label: 'Budget', model: 'Wan 2.1 / MiniMax', cost: 0.08, quality: 62, latency: '~45s' },
  balanced: { label: 'Balanced', model: 'Kling 2.1 / Veo 3 Fast', cost: 0.25, quality: 82, latency: '~90s' },
  premium: { label: 'Premium', model: 'Kling Pro / Creatify Aurora', cost: 0.65, quality: 95, latency: '~120s' },
}

export function CostRouteDashboard() {
  const [mode, setMode] = useState<Mode>('t2v')
  const [tier, setTier] = useState<Tier>('balanced')
  const [budget, setBudget] = useState(2)
  const [clips, setClips] = useState(3)

  const t = TIERS[tier]
  const totalCost = t.cost * clips
  const overBudget = totalCost > budget

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Clapperboard className="size-4 text-accent" /> Video routing: T2V / I2V + бюджет
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('t2v')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              mode === 't2v' ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted'
            }`}
          >
            <Film className="size-4" /> T2V — только текст
          </button>
          <button
            onClick={() => setMode('i2v')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
              mode === 'i2v' ? 'border-violet bg-violet/10 text-violet' : 'border-line text-muted'
            }`}
          >
            <ImageIcon className="size-4" /> I2V — keyframe + motion
          </button>
        </div>

        {mode === 'i2v' && (
          <div className="rounded-lg border border-violet/30 bg-violet/5 px-3 py-2 text-[13px] text-muted">
            I2V: сначала FLUX/DALL-E keyframe → потом Kling animates image. Дороже, но контролируемее композиция.
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TIERS) as Tier[]).map((k) => (
            <button
              key={k}
              onClick={() => setTier(k)}
              className={`rounded-xl border p-3 text-left transition-all ${
                tier === k ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/30'
              }`}
            >
              <div className="text-xs font-bold uppercase text-muted">{TIERS[k].label}</div>
              <div className="text-sm font-semibold text-title">{TIERS[k].model}</div>
              <div className="font-mono text-xs text-accent">${TIERS[k].cost}/clip</div>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">Бюджет сессии ($)</span>
              <span className="font-mono text-accent">${budget.toFixed(2)}</span>
            </div>
            <input type="range" min={0.5} max={5} step={0.25} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="h-2 w-full accent-accent" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted">Клипов</span>
              <span className="font-mono text-accent">{clips}</span>
            </div>
            <input type="range" min={1} max={8} value={clips} onChange={(e) => setClips(Number(e.target.value))} className="h-2 w-full accent-accent" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
            <DollarSign className="mx-auto mb-1 size-4 text-warn" />
            <div className={`text-xl font-bold ${overBudget ? 'text-bad' : 'text-good'}`}>${totalCost.toFixed(2)}</div>
            <div className="text-[11px] text-muted">итого за {clips} клипа</div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
            <div className="text-xl font-bold text-title">{t.quality}%</div>
            <div className="text-[11px] text-muted">оценка качества</div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
            <div className="text-xl font-bold text-title">{t.latency}</div>
            <div className="text-[11px] text-muted">на клип</div>
          </div>
        </div>

        <motion.div animate={{ width: `${Math.min(100, (t.quality / 100) * 100)}%` }} className="h-2 rounded-full bg-gradient-to-r from-accent to-violet" />

        {overBudget && (
          <div className="rounded-lg border border-bad/30 bg-bad/5 p-3 text-[13px] text-muted">
            Превышен бюджет! Routing: снизь tier до Budget, уменьши clips, или используй моки на этапе отладки (Project 5 совет).
          </div>
        )}
      </div>
    </div>
  )
}

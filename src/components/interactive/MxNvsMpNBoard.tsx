import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cable, Grid3X3, Minus, Plus } from 'lucide-react'

export function MxNvsMpNBoard() {
  const [platforms, setPlatforms] = useState(4)
  const [tools, setTools] = useState(6)
  const [useMcp, setUseMcp] = useState(false)

  const meshIntegrations = platforms * tools
  const busIntegrations = platforms + tools

  const Slider = ({ label, value, set, min, max }: { label: string; value: number; set: (v: number) => void; min: number; max: number }) => (
    <div className="flex-1">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-title">{label}</span>
        <span className="font-mono font-bold text-accent">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => set(Math.max(min, value - 1))} className="rounded-lg border border-line p-1 text-muted hover:border-accent/50">
          <Minus className="size-4" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
        />
        <button onClick={() => set(Math.min(max, value + 1))} className="rounded-lg border border-line p-1 text-muted hover:border-accent/50">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Grid3X3 className="size-4 text-accent" /> N×M vs M+N
        </span>
        <button
          onClick={() => setUseMcp((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            useMcp ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:border-accent/40'
          }`}
        >
          <Cable className="size-3.5" />
          {useMcp ? 'С MCP' : 'Без MCP'}
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Slider label="Платформ (M)" value={platforms} set={setPlatforms} min={2} max={8} />
          <Slider label="Инструментов (N)" value={tools} set={setTools} min={2} max={10} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div
            layout
            className={`rounded-xl border p-4 ${!useMcp ? 'border-bad/50 bg-bad/5' : 'border-line bg-surface-2/40 opacity-50'}`}
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-bad">Без MCP · N×M</div>
            <div className="text-3xl font-extrabold text-title">{meshIntegrations}</div>
            <div className="text-sm text-muted">отдельных интеграций</div>
            <p className="mt-2 text-[13px] text-muted">Каждая платформа × каждый инструмент = свой адаптер</p>
          </motion.div>

          <motion.div
            layout
            className={`rounded-xl border p-4 ${useMcp ? 'border-good/50 bg-good/5' : 'border-line bg-surface-2/40 opacity-50'}`}
          >
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-good">С MCP · M+N</div>
            <div className="text-3xl font-extrabold text-title">{busIntegrations}</div>
            <div className="text-sm text-muted">коннекторов через шину</div>
            <p className="mt-2 text-[13px] text-muted">M клиентов + N серверов — один протокол</p>
          </motion.div>
        </div>

        {!useMcp ? (
          <div
            className="relative grid h-32 gap-0.5 overflow-hidden rounded-xl border border-line bg-surface-2/40 p-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(tools, 10)}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${Math.min(platforms, 8)}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: Math.min(platforms * tools, 80) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.015 }}
                className="rounded-sm bg-bad/30"
              />
            ))}
          </div>
        ) : (
          <div className="relative flex h-32 items-center justify-center gap-4 overflow-hidden rounded-xl border border-line bg-surface-2/40 px-4">
            <div className="flex flex-col gap-1">
              {Array.from({ length: Math.min(platforms, 8) }).map((_, i) => (
                <div key={i} className="h-2 w-8 rounded-full bg-violet/60" />
              ))}
            </div>
            <div className="h-full w-1 rounded-full bg-accent/60" />
            <div className="flex flex-col gap-1">
              {Array.from({ length: Math.min(tools, 10) }).map((_, i) => (
                <div key={i} className="h-2 w-8 rounded-full bg-accent/60" />
              ))}
            </div>
          </div>
        )}

        <p className="text-[13.5px] leading-relaxed text-muted">
          {useMcp
            ? `Экономия: ${meshIntegrations - busIntegrations} интеграций не нужно писать. MCP — «USB-C для AI»: один протокол, любые host и server.`
            : `При ${platforms} платформах и ${tools} инструментах нужно ${meshIntegrations} парных интеграций. Каждый новый инструмент умножает работу на число платформ.`}
        </p>
      </div>
    </div>
  )
}

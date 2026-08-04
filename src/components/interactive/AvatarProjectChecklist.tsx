import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  points: number
}

interface ChecklistGroup {
  title: string
  items: ChecklistItem[]
}

const GROUPS: ChecklistGroup[] = [
  {
    title: 'MCP-серверы (25 баллов)',
    items: [
      { id: 'mcp2', text: 'Минимум 2 MCP-сервера: 2GIS + Chocolife (stdio/SSE)', points: 12 },
      { id: 'mcp-tools', text: 'search_restaurants и search_deals возвращают реальные данные', points: 8 },
      { id: 'mcp-readme', text: 'README: как запустить MCP-серверы', points: 5 },
    ],
  },
  {
    title: 'LLM + Tool Calling + Memory (20 баллов)',
    items: [
      { id: 'llm-auto', text: 'LLM автоматически выбирает tools (не hardcode)', points: 10 },
      { id: 'memory', text: 'Сессионная память диалога работает', points: 10 },
    ],
  },
  {
    title: 'Vision + Custom Skill (15 баллов)',
    items: [
      { id: 'vision', text: 'Vision: фото блюда/интерьера учитывается в ответе', points: 10 },
      { id: 'critic', text: 'Skill analyze_restaurant_photo: level, status, description, confidence', points: 5 },
    ],
  },
  {
    title: 'Voice + Avatar (30 баллов)',
    items: [
      { id: 'clone', text: 'Voice clone ≥10 сек + TTS клонированным голосом', points: 10 },
      { id: 'avatar', text: 'Avatar video: lip sync корректный (Aurora / Kling)', points: 20 },
    ],
  },
  {
    title: 'Сдача (10 баллов)',
    items: [
      { id: 'readme', text: 'README + .env.example (без реальных ключей)', points: 5 },
      { id: 'demo', text: 'Видео-демо 2–3 минуты', points: 5 },
    ],
  },
  {
    title: 'Бонус (+10)',
    items: [{ id: 'cost', text: 'Model routing, caching, detail:low для изображений', points: 10 }],
  },
]

const STORAGE_KEY = 'rag-conspect-p5-checklist-v1'

export function AvatarProjectChecklist() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return new Set(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
    } catch {
      // ignore
    }
  }, [checked])

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const earned = GROUPS.reduce((sum, g) => sum + g.items.filter((i) => checked.has(i.id)).reduce((s, i) => s + i.points, 0), 0)
  const maxPoints = GROUPS.reduce((s, g) => s + g.items.reduce((a, i) => a + i.points, 0), 0)

  return (
    <div className="my-8">
      <div className="card sticky top-14 z-10 mb-5 flex items-center gap-4 p-4 backdrop-blur lg:top-2">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-line)" strokeWidth="6" />
            <motion.circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="url(#p5-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 27}
              animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - earned / maxPoints) }}
            />
            <defs>
              <linearGradient id="p5-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[13px] font-bold text-title">{earned}</span>
        </div>
        <div>
          <div className="font-bold text-title">~{earned} из {maxPoints} баллов</div>
          <div className="text-sm text-muted">Project 5 · AI Avatar Agent. Базовый максимум 100 + бонус 10.</div>
        </div>
      </div>

      {GROUPS.map((group) => {
        const pts = group.items.reduce((s, i) => s + i.points, 0)
        const donePts = group.items.filter((i) => checked.has(i.id)).reduce((s, i) => s + i.points, 0)
        return (
          <div key={group.title} className="card mb-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
              <span className="text-sm font-semibold text-title">{group.title}</span>
              <span className={`text-xs font-bold ${donePts === pts ? 'text-good' : 'text-muted'}`}>{donePts}/{pts}</span>
            </div>
            <div className="divide-y divide-line/40">
              {group.items.map((item) => {
                const isChecked = checked.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2/50"
                  >
                    <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${isChecked ? 'border-good bg-good text-bg' : 'border-line'}`}>
                      {isChecked && <Check className="size-3.5" />}
                    </span>
                    <span className={`flex-1 text-[14px] leading-relaxed ${isChecked ? 'text-muted line-through' : 'text-ink/90'}`}>{item.text}</span>
                    <span className="shrink-0 text-xs font-mono text-muted">+{item.points}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Check, Hammer, MessageSquare, RotateCcw } from 'lucide-react'

type Bucket = 'tool' | 'resource' | 'prompt' | null

interface Card {
  id: string
  text: string
  hint: string
  bucket: Bucket
}

const CARDS: Card[] = [
  { id: 'search', text: 'search_restaurants(query)', hint: 'Действие с side-effect: ищет и возвращает результат', bucket: 'tool' },
  { id: 'schema', text: 'postgres://schema/users', hint: 'Чтение данных: схема таблицы как контекст', bucket: 'resource' },
  { id: 'review', text: 'code-review template', hint: 'Шаблон промпта для повторяемой задачи', bucket: 'prompt' },
  { id: 'screenshot', text: 'browser_take_screenshot()', hint: 'Выполняет действие в браузере', bucket: 'tool' },
  { id: 'docs', text: 'context7://react/docs', hint: 'URI-ресурс: актуальная документация', bucket: 'resource' },
  { id: 'sql', text: 'explain-sql style guide', hint: 'Готовый промпт для объяснения запросов', bucket: 'prompt' },
  { id: 'weather', text: 'get_weather(city)', hint: 'Вызывает API и возвращает JSON', bucket: 'tool' },
  { id: 'config', text: 'file://.mcp.json', hint: 'Конфигурация как readable resource', bucket: 'resource' },
]

const BUCKETS = [
  { id: 'tool' as const, label: 'Tools', icon: Hammer, desc: '~95% use-cases: действия с аргументами' },
  { id: 'resource' as const, label: 'Resources', icon: BookOpen, desc: 'Данные для чтения: URI + контент' },
  { id: 'prompt' as const, label: 'Prompts', icon: MessageSquare, desc: 'Шаблоны промптов с параметрами' },
]

export function MCPPrimitivesPicker() {
  const [assignments, setAssignments] = useState<Record<string, Bucket>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const unassigned = CARDS.filter((c) => !assignments[c.id])
  const score = CARDS.filter((c) => assignments[c.id] === c.bucket).length

  const assignToBucket = (bucket: Bucket) => {
    const cardId = selected ?? unassigned[0]?.id
    if (!cardId || !bucket) return
    setAssignments((prev) => ({ ...prev, [cardId]: bucket }))
    setSelected(null)
    setRevealed(false)
  }

  const returnToPool = (cardId: string) => {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    setSelected(cardId)
    setRevealed(false)
  }

  const reset = () => {
    setAssignments({})
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="text-sm font-semibold text-title">Примитивы MCP: разложи по полочкам</span>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-accent/40"
        >
          <RotateCcw className="size-3" /> Сброс
        </button>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-[13px] text-muted">
          Выбери карточку в пуле, затем кликни на нужную колонку. Карточку в колонке можно вернуть в пул повторным кликом.
        </p>

        <div className="flex flex-wrap gap-2">
          {unassigned.map((c) => {
            const isSelected = selected === c.id
            return (
              <motion.button
                key={c.id}
                type="button"
                layout
                onClick={() => {
                  setSelected(isSelected ? null : c.id)
                  setRevealed(false)
                }}
                className={`rounded-lg border px-3 py-2 text-left text-[13px] font-mono transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent/15 text-accent ring-2 ring-accent/30'
                    : 'border-accent/30 bg-accent/5 text-accent hover:border-accent/60'
                }`}
              >
                {c.text}
              </motion.button>
            )
          })}
          {unassigned.length === 0 && (
            <span className="text-sm text-good">Все карточки разложены!</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {BUCKETS.map((b) => {
            const Icon = b.icon
            const items = CARDS.filter((c) => assignments[c.id] === b.id)
            const canDrop = unassigned.length > 0
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => canDrop && assignToBucket(b.id)}
                disabled={!canDrop}
                className={`min-h-[120px] rounded-xl border border-dashed p-3 text-left transition-colors ${
                  canDrop
                    ? 'cursor-pointer border-line bg-surface-2/40 hover:border-accent/50'
                    : 'cursor-default border-line/60 bg-surface-2/20 opacity-80'
                }`}
              >
                <div className="mb-2 flex items-center gap-2 font-semibold text-title">
                  <Icon className="size-4 text-violet" />
                  {b.label}
                </div>
                <p className="mb-2 text-[11px] text-muted">{b.desc}</p>
                <div className="space-y-1">
                  {items.map((c) => {
                    const ok = revealed && c.bucket === b.id
                    const bad = revealed && c.bucket !== b.id
                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          returnToPool(c.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            returnToPool(c.id)
                          }
                        }}
                        className={`cursor-pointer rounded-md px-2 py-1 font-mono text-[11px] transition-colors hover:ring-1 hover:ring-accent/40 ${
                          ok ? 'bg-good/15 text-good' : bad ? 'bg-bad/15 text-bad line-through' : 'bg-surface text-ink/80'
                        }`}
                        title="Клик — вернуть в пул"
                      >
                        {c.text}
                      </div>
                    )
                  })}
                </div>
                {canDrop && (
                  <div className="mt-2 text-[10px] text-muted">
                    {selected
                      ? `Клик — положить «${CARDS.find((x) => x.id === selected)?.text}»`
                      : `Клик — положить «${unassigned[0]?.text}»`}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={unassigned.length > 0}
            className="btn-primary text-sm disabled:opacity-40"
          >
            <Check className="size-4" /> Проверить
          </button>
          {revealed && (
            <span className={`text-sm font-bold ${score === CARDS.length ? 'text-good' : 'text-warn'}`}>
              {score}/{CARDS.length} верно
            </span>
          )}
        </div>

        {revealed && score < CARDS.length && (
          <div className="rounded-lg border border-warn/30 bg-warn/5 p-3 text-[13px] text-muted">
            Подсказка: Tool — <strong>делает</strong> (API, браузер, запись). Resource — <strong>отдаёт данные</strong> по URI. Prompt — <strong>шаблон</strong> для LLM.
          </div>
        )}
      </div>
    </div>
  )
}

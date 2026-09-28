import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Eye, Layers, Repeat, RotateCcw } from 'lucide-react'

type Status = 'know' | 'repeat'
type StatusMap = Record<string, Status>

export interface Flashcard {
  q: string
  a: ReactNode
}

const STORAGE_PREFIX = 'rag-conspect-cards-'

function loadStatus(id: string): StatusMap {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as StatusMap) : {}
  } catch {
    return {}
  }
}

function saveStatus(id: string, status: StatusMap) {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(status))
  } catch {
    // localStorage недоступен (приватный режим, заблокированы данные сайта)
  }
}

/** Флеш-карты: одна карточка на экране, «Знаю» / «Повторить», статус хранится по тексту вопроса */
export function Flashcards({ id, cards }: { id: string; cards: Flashcard[] }) {
  const [status, setStatus] = useState<StatusMap>(() => loadStatus(id))
  const [onlyRepeat, setOnlyRepeat] = useState(false)
  const [pos, setPos] = useState(0)
  const [shown, setShown] = useState(false)

  const deck = useMemo(() => cards.filter((c) => !onlyRepeat || status[c.q] === 'repeat'), [cards, onlyRepeat, status])
  const known = cards.filter((c) => status[c.q] === 'know').length
  const toRepeat = cards.filter((c) => status[c.q] === 'repeat').length
  const index = Math.min(pos, Math.max(deck.length - 1, 0))
  const card = deck[index]
  // Уходящая карточка (exit-анимация) ещё кликабельна: её кнопки не должны менять статус новой
  const liveQ = useRef('')
  useEffect(() => {
    liveQ.current = card?.q ?? ''
  })

  const go = (next: number) => {
    setPos(Math.max(0, Math.min(next, deck.length - 1)))
    setShown(false)
  }

  const mark = (value: Status, q: string) => {
    if (!card || q !== liveQ.current) return
    const next = { ...status, [card.q]: value }
    setStatus(next)
    saveStatus(id, next)
    setShown(false)
    // В фильтре «повторить» отмеченная «знаю» карточка уходит из колоды — индекс сам укажет на следующую
    if (!(onlyRepeat && value === 'know')) setPos(Math.min(index + 1, deck.length - 1))
  }

  const reset = () => {
    setStatus({})
    saveStatus(id, {})
    setOnlyRepeat(false)
    setPos(0)
    setShown(false)
  }

  const toggleFilter = () => {
    setOnlyRepeat((v) => !v)
    setPos(0)
    setShown(false)
  }

  const btn = 'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-medium transition-colors'

  return (
    <div className="card my-8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-title">
          <Layers className="size-4 text-accent" /> Флеш-карты
        </span>
        <span className="text-[13px] text-muted">
          знаю <span className="font-semibold text-good">{known}</span> из {cards.length}
          {toRepeat > 0 && <span className="ml-2 text-warn">· повторить {toRepeat}</span>}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div initial={false} animate={{ width: `${(known / Math.max(cards.length, 1)) * 100}%` }} className="h-full rounded-full bg-good" />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={toggleFilter}
            className={`${btn} ${onlyRepeat ? 'border-accent bg-accent/15 text-title' : 'border-line bg-surface-2 text-muted hover:text-ink'}`}
          >
            <Repeat className="size-4" /> только «повторить»
          </button>
          <button onClick={reset} className={`${btn} border-line bg-surface-2 text-muted hover:text-ink`}>
            <RotateCcw className="size-4" /> Сброс
          </button>
        </div>

        {!card ? (
          <div className="rounded-xl border border-line bg-surface-2/60 p-6 text-center text-[14.5px] text-muted">
            Карточек «повторить» нет.{' '}
            <button onClick={toggleFilter} className="font-medium text-accent hover:underline">
              Показать все
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={card.q}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              className="rounded-xl border border-line bg-surface-2/60 p-4 sm:p-5"
            >
              <div className="mb-2 flex items-center justify-between gap-2 text-[12.5px] text-muted">
                <span>
                  Карточка {index + 1} / {deck.length}
                </span>
                {status[card.q] && (
                  <span className={`chip ${status[card.q] === 'know' ? 'text-good' : 'text-warn'}`}>
                    {status[card.q] === 'know' ? 'знаю' : 'повторить'}
                  </span>
                )}
              </div>
              <h3 className="mb-4 text-[16.5px] font-semibold leading-snug text-title">{card.q}</h3>

              {shown ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-accent/20 bg-accent/5 p-3.5 text-[14.5px] leading-relaxed text-ink/90 [&_code]:text-accent"
                >
                  {card.a}
                </motion.div>
              ) : (
                <button onClick={() => card.q === liveQ.current && setShown(true)} className={`${btn} w-full border-accent/50 bg-accent/10 text-title hover:bg-accent/15`}>
                  <Eye className="size-4" /> Показать ответ
                </button>
              )}

              {shown && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => mark('know', card.q)} className={`${btn} border-good/50 bg-good/10 text-title hover:bg-good/15`}>
                    <Check className="size-4 text-good" /> Знаю
                  </button>
                  <button onClick={() => mark('repeat', card.q)} className={`${btn} border-warn/50 bg-warn/10 text-title hover:bg-warn/15`}>
                    <Repeat className="size-4 text-warn" /> Повторить
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {card && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <button onClick={() => go(index - 1)} disabled={index === 0} className={`${btn} min-w-11 border-line bg-surface text-ink disabled:opacity-40`}>
              <ChevronLeft className="size-4" /> Назад
            </button>
            <button
              onClick={() => go(index + 1)}
              disabled={index >= deck.length - 1}
              className={`${btn} min-w-11 border-line bg-surface text-ink disabled:opacity-40`}
            >
              Вперёд <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

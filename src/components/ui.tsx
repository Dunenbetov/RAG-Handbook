import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, AlertTriangle, Info, Flame, Sparkles, Target, BookOpen, Check, X, Star } from 'lucide-react'
import { useReducedMotion } from '../lib/motion'

/** Инлайновые иконки-маркеры для списков и таблиц — замена эмодзи ✅ ❌ ⭐ ⚠️ */
export function Yes() {
  return <Check className="mr-1 inline size-4 shrink-0 -translate-y-px text-good" aria-label="плюс" />
}

export function No() {
  return <X className="mr-1 inline size-4 shrink-0 -translate-y-px text-bad" aria-label="минус" />
}

export function Fav() {
  return <Star className="mr-1 inline size-4 shrink-0 -translate-y-px fill-warn/25 text-warn" aria-label="рекомендуется" />
}

export function Warn() {
  return <AlertTriangle className="mr-1 inline size-4 shrink-0 -translate-y-px text-warn" aria-label="внимание" />
}

/** Секция урока с заголовком — основная единица структуры */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.section
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
      className="mb-12"
    >
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-title">
        <span className="mr-3 inline-block h-5 w-1.5 translate-y-0.5 rounded-full bg-gradient-to-b from-accent to-violet" />
        {title}
      </h2>
      <div className="lesson-body">{children}</div>
    </motion.section>
  )
}

const calloutStyles = {
  info: { border: 'border-accent/40', bg: 'bg-accent/5', icon: <Info className="size-5 text-accent" />, label: 'Важно знать' },
  tip: { border: 'border-good/40', bg: 'bg-good/5', icon: <Lightbulb className="size-5 text-good" />, label: 'Совет' },
  warn: { border: 'border-warn/40', bg: 'bg-warn/5', icon: <AlertTriangle className="size-5 text-warn" />, label: 'Осторожно' },
  danger: { border: 'border-bad/40', bg: 'bg-bad/5', icon: <Flame className="size-5 text-bad" />, label: 'Частая ошибка' },
} as const

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: keyof typeof calloutStyles
  title?: string
  children: ReactNode
}) {
  const s = calloutStyles[type]
  return (
    <div className={`my-6 rounded-2xl border ${s.border} ${s.bg} p-5`}>
      <div className="mb-2 flex items-center gap-2 font-semibold text-title">
        {s.icon}
        {title ?? s.label}
      </div>
      <div className="text-[15.5px] leading-relaxed text-ink/85 [&>p]:mb-3 [&>p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}

/** Аналогия из жизни — фирменный блок «объясняем на пальцах» */
export function Analogy({ title = 'Аналогия из жизни', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="my-6 rounded-2xl border border-violet/40 bg-violet/5 p-5">
      <div className="mb-2 flex items-center gap-2 font-semibold text-title">
        <Sparkles className="size-5 text-violet" />
        {title}
      </div>
      <div className="text-[15.5px] leading-relaxed text-ink/85 [&>p]:mb-3 [&>p:last-child]:mb-0">{children}</div>
    </div>
  )
}

/** Главная мысль урока */
export function KeyIdea({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-2xl bg-gradient-to-r from-accent/15 to-violet/15 p-[1px]">
      <div className="rounded-2xl bg-surface p-5">
        <div className="mb-2 flex items-center gap-2 font-semibold text-title">
          <Target className="size-5 text-accent" />
          Главная мысль
        </div>
        <div className="text-[16px] font-medium leading-relaxed text-ink">{children}</div>
      </div>
    </div>
  )
}

/** Связь урока с практическим проектом */
export function ProjectNote({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-2xl border border-warn/30 bg-warn/5 p-5">
      <div className="mb-2 flex items-center gap-2 font-semibold text-title">
        <BookOpen className="size-5 text-warn" />
        Как это применить в проекте
      </div>
      <div className="text-[15.5px] leading-relaxed text-ink/85 [&>p]:mb-3 [&>p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}

/** Формула с пояснением */
export function Formula({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-line bg-surface-2 p-5 text-center">
      <div className="font-mono text-lg text-accent">{children}</div>
      {note && <div className="mt-2 text-sm text-muted">{note}</div>}
    </div>
  )
}

/** Стилизованная таблица */
export function Tbl({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[560px] text-left text-[14.5px]">
        <thead>
          <tr className="border-b border-line bg-surface-2">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-title">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/50 last:border-0 hover:bg-surface-2/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-ink/85">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Пошаговый список с крупными номерами */
export function Steps({ items }: { items: { title: ReactNode; body: ReactNode }[] }) {
  return (
    <div className="my-6 space-y-4">
      {items.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07, duration: 0.35 }}
          className="flex gap-4 rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-violet/20 font-mono font-bold text-accent">
            {i + 1}
          </div>
          <div>
            <div className="mb-1 font-semibold text-title">{step.title}</div>
            <div className="text-[15px] leading-relaxed text-ink/80">{step.body}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/** Сравнение двух подходов бок-о-бок */
export function VS({
  left,
  right,
}: {
  left: { title: ReactNode; tone?: 'good' | 'bad' | 'neutral'; children: ReactNode }
  right: { title: ReactNode; tone?: 'good' | 'bad' | 'neutral'; children: ReactNode }
}) {
  const tone = (t?: 'good' | 'bad' | 'neutral') =>
    t === 'good' ? 'border-good/40' : t === 'bad' ? 'border-bad/40' : 'border-line'
  return (
    <div className="my-6 grid gap-4 md:grid-cols-2">
      {[left, right].map((side, i) => (
        <div key={i} className={`rounded-2xl border ${tone(side.tone)} bg-surface p-5`}>
          <div className="mb-2 font-semibold text-title">{side.title}</div>
          <div className="text-[15px] leading-relaxed text-ink/80 [&>p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
            {side.children}
          </div>
        </div>
      ))}
    </div>
  )
}

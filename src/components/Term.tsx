import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { glossaryById } from '../lib/glossary'

/**
 * Кликабельный термин: подчёркнут пунктиром, по клику — карточка с определением
 * из глоссария и ссылкой на полный глоссарий.
 */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const term = glossaryById.get(id)
  if (!term) return <>{children}</>

  return (
    <span className="relative inline">
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-help border-b border-dashed border-accent/60 text-accent/95 transition-colors hover:border-accent hover:text-accent"
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 block w-80 max-w-[80vw] rounded-xl border border-line bg-surface-2 p-4 text-left shadow-2xl shadow-black/50"
            >
              <span className="mb-1 block text-sm font-bold text-title">
                {term.term}
                {term.en && <span className="ml-2 font-normal text-muted">{term.en}</span>}
              </span>
              <span className="block text-[13.5px] font-normal leading-relaxed text-ink/85">{term.short}</span>
              <Link
                to={`/glossary#${term.id}`}
                className="mt-2 block text-xs font-medium text-accent hover:underline"
                onClick={() => setOpen(false)}
              >
                Подробнее в глоссарии →
              </Link>
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  )
}

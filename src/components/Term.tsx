import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { glossaryById } from '../lib/glossary'
import { useMediaQuery } from '../lib/motion'

/**
 * Кликабельный термин: подчёркнут пунктиром, по клику — карточка с определением
 * из глоссария и ссылкой на полный глоссарий.
 */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 639px)')
  const term = glossaryById.get(id)
  if (!term) return <>{children}</>

  const card = (
    <>
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
    </>
  )

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
            <span className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
            {isMobile ? (
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 block rounded-xl border border-line bg-surface-2 p-4 text-left shadow-2xl shadow-black/50"
              >
                {card}
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-50 mt-2 block w-80 max-w-[80vw] rounded-xl border border-line bg-surface-2 p-4 text-left shadow-2xl shadow-black/50"
              >
                {card}
              </motion.span>
            )}
          </>
        )}
      </AnimatePresence>
    </span>
  )
}

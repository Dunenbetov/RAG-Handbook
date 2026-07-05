import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookMarked, BrainCircuit, Check, ChevronDown, Lock, Menu, X } from 'lucide-react'
import { chapters, isChapterLocked, lessonKey } from '../lib/curriculum'
import { useProgress } from '../lib/progress'
import { ThemeToggle } from './ThemeToggle'

function ChapterGroup({ chapterId, forceOpen }: { chapterId: string; forceOpen: boolean }) {
  const chapter = chapters.find((c) => c.id === chapterId)!
  const progress = useProgress()
  const locked = isChapterLocked(chapterId, progress.done)
  const [open, setOpen] = useState(forceOpen && !locked)
  const doneCount = chapter.lessons.filter((l) => progress.isDone(lessonKey(chapter.id, l.id))).length

  return (
    <div className="mb-1">
      <button
        onClick={() => !locked && setOpen((v) => !v)}
        disabled={locked}
        title={locked ? 'Откроется, когда пройдёшь остальные главы' : undefined}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold transition-colors ${
          locked ? 'cursor-not-allowed text-muted/60' : 'text-ink hover:bg-surface-2'
        }`}
      >
        <chapter.icon className={`size-4 shrink-0 ${locked ? 'text-muted/60' : 'text-accent'}`} />
        <span className="flex-1 truncate">{chapter.title}</span>
        {locked ? (
          <Lock className="size-3.5 shrink-0 text-muted/60" />
        ) : (
          <>
            <span className={`text-[11px] font-medium ${doneCount === chapter.lessons.length ? 'text-good' : 'text-muted'}`}>
              {doneCount}/{chapter.lessons.length}
            </span>
            <ChevronDown className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && !locked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 border-l border-line pl-2 pt-1">
              {chapter.lessons.map((l) => {
                const key = lessonKey(chapter.id, l.id)
                const done = progress.isDone(key)
                return (
                  <NavLink
                    key={l.id}
                    to={`/${chapter.id}/${l.id}`}
                    className={({ isActive }) =>
                      `mb-0.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                        isActive ? 'bg-violet/15 font-medium text-title' : 'text-muted hover:bg-surface-2 hover:text-ink'
                      }`
                    }
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                        done ? 'border-good bg-good/20 text-good' : 'border-line text-transparent'
                      }`}
                    >
                      <Check className="size-2.5" />
                    </span>
                    <span className="truncate">{l.title}</span>
                  </NavLink>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent() {
  const location = useLocation()
  const progress = useProgress()
  const activeChapter = location.pathname.split('/')[1]

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-2.5 px-3">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet">
            <BrainCircuit className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight text-title">RAG Handbook</div>
            <div className="text-[11px] text-muted">интерактивный учебник</div>
          </div>
        </Link>
        <ThemeToggle className="shrink-0" />
      </div>

      <div className="mb-4 px-3">
        <div className="mb-1.5 flex justify-between text-[11px] text-muted">
          <span>Прогресс курса</span>
          <span className="font-semibold text-accent">{progress.percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-accent to-violet"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {chapters.map((c) => (
          <ChapterGroup key={c.id} chapterId={c.id} forceOpen={c.id === activeChapter || (!activeChapter && c.id === 'ch0')} />
        ))}
        <NavLink
          to="/glossary"
          className={({ isActive }) =>
            `mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
              isActive ? 'bg-violet/15 text-title' : 'text-ink hover:bg-surface-2'
            }`
          }
        >
          <BookMarked className="size-4 text-accent" />
          Глоссарий
        </NavLink>
      </nav>
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* мобильная шапка */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-bold text-title">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet">
            <BrainCircuit className="size-4 text-white" />
          </span>
          RAG Handbook
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(true)} className="rounded-lg border border-line p-2 text-ink">
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* десктопный сайдбар */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-line bg-surface/60 py-5 backdrop-blur lg:block">
        <SidebarContent />
      </aside>

      {/* мобильный drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              key={location.pathname}
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-surface py-5 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
              <div onClick={() => setMobileOpen(false)} className="h-full">
                <SidebarContent />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookMarked, BrainCircuit, Check, ChevronDown, Flame, Menu, UserRound, X } from 'lucide-react'
import { chapters, lessonKey } from '../lib/curriculum'
import { useProgress } from '../lib/progress'
import { ThemeToggle } from './ThemeToggle'
import { useAccount } from '../lib/account'

function ChapterGroup({
  chapterId,
  forceOpen,
  onNavigate,
}: {
  chapterId: string
  forceOpen: boolean
  onNavigate?: () => void
}) {
  const chapter = chapters.find((c) => c.id === chapterId)!
  const progress = useProgress()
  const [open, setOpen] = useState(forceOpen)
  const doneCount = chapter.lessons.filter((l) => progress.isDone(lessonKey(chapter.id, l.id))).length

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        <chapter.icon className="size-4 shrink-0 text-accent" />
        <span className="flex-1 truncate">{chapter.title}</span>
        <span className={`text-[11px] font-medium ${doneCount === chapter.lessons.length ? 'text-good' : 'text-muted'}`}>
          {doneCount}/{chapter.lessons.length}
        </span>
        <ChevronDown className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
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
                    onClick={onNavigate}
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

function SidebarContent({ onNavigate, onOpenAccount }: { onNavigate?: () => void; onOpenAccount: () => void }) {
  const location = useLocation()
  const progress = useProgress()
  const { account, streak } = useAccount()
  const activeChapter = location.pathname.split('/')[1]

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-2.5 px-3">
        <Link to="/" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet">
            <BrainCircuit className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight text-title">LLM Handbook</div>
            <div className="text-[11px] text-muted">практика LLM-инженерии</div>
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

      <div className="mb-3 px-3">
        <button onClick={onOpenAccount} className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface-2/70 px-3 py-2.5 text-left transition-colors hover:border-violet/60">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet/15 text-violet"><UserRound className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{account?.name ?? 'Войти в профиль'}</span><span className="block text-[11px] text-muted">{account ? account.email : 'синхронизация появится позже'}</span></span>
          {streak > 0 && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-warn"><Flame className="size-3.5" />{streak}</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {chapters.map((c) => (
          <ChapterGroup
            key={c.id}
            chapterId={c.id}
            forceOpen={c.id === activeChapter || (!activeChapter && c.id === 'ch0')}
            onNavigate={onNavigate}
          />
        ))}
        <NavLink
          to="/glossary"
          onClick={onNavigate}
          className={({ isActive }) =>
            `mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
              isActive ? 'bg-violet/15 text-title' : 'text-ink hover:bg-surface-2'
            }`
          }
        >
          <BookMarked className="size-4 text-accent" />
          Глоссарий
        </NavLink>
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) => `mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${isActive ? 'bg-violet/15 text-title' : 'text-ink hover:bg-surface-2'}`}
        >
          <UserRound className="size-4 text-violet" />
          Мой прогресс
        </NavLink>
      </nav>
    </div>
  )
}

export function Sidebar({ onOpenAccount }: { onOpenAccount: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <>
      {/* мобильная шапка */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-bold text-title">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet">
            <BrainCircuit className="size-4 text-white" />
          </span>
          LLM Handbook
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            aria-expanded={mobileOpen}
            className="flex size-11 items-center justify-center rounded-lg border border-line text-ink"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* десктопный сайдбар */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-line bg-surface/60 py-5 backdrop-blur lg:block">
        <SidebarContent onOpenAccount={onOpenAccount} />
      </aside>

      {/* мобильный drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-line bg-surface py-5 pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
              <button
                onClick={closeMobile}
                aria-label="Закрыть меню"
                className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-lg text-muted hover:text-ink"
              >
                <X className="size-5" />
              </button>
              <SidebarContent onNavigate={closeMobile} onOpenAccount={onOpenAccount} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

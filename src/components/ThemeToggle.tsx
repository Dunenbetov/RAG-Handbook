import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { toggleTheme, useTheme } from '../lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      className={`relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-muted transition-colors hover:border-violet/60 hover:text-ink ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -60 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 60 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

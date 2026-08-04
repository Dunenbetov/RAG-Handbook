import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { glossary } from '../lib/glossary'
import { chapters } from '../lib/curriculum'

const chapterNames = new Map(chapters.map((c) => [c.id, c.title]))

export function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  const location = useLocation()

  // скролл к термину при переходе по якорю из урока
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) {
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [location.hash])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return glossary.filter((t) => {
      if (filter && t.chapter !== filter) return false
      if (!q) return true
      return (
        t.term.toLowerCase().includes(q) ||
        (t.en ?? '').toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        t.long.toLowerCase().includes(q)
      )
    })
  }, [query, filter])

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-10 md:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-2 text-3xl font-extrabold text-title md:text-4xl">Глоссарий</h1>
        <p className="mb-8 text-muted">
          {glossary.length} терминов модуля RAG — от базовых понятий до GraphRAG. Кликай на термины прямо в уроках.
        </p>
      </motion.div>

      <div className="sticky top-14 z-10 -mx-2 mb-6 bg-bg/90 px-2 py-3 backdrop-blur lg:top-0">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти термин: embedding, BM25, faithfulness…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-[15px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`chip cursor-pointer transition-colors ${!filter ? 'border-accent/60 text-accent' : 'hover:text-ink'}`}
          >
            Все
          </button>
          {chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(filter === c.id ? null : c.id)}
              className={`chip cursor-pointer transition-colors ${filter === c.id ? 'border-accent/60 text-accent' : 'hover:text-ink'}`}
            >
              <c.icon className="size-3.5" /> {c.title}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div className="card p-8 text-center text-muted">Ничего не нашлось. Попробуй другой запрос.</div>}

      <div className="space-y-3">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            id={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className={`card p-5 target:border-accent ${location.hash.slice(1) === t.id ? 'border-accent/70' : ''}`}
          >
            <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
              <h3 className="text-lg font-bold text-title">{t.term}</h3>
              {t.en && <span className="font-mono text-xs text-muted">{t.en}</span>}
              <span className="chip ml-auto">{chapterNames.get(t.chapter)}</span>
            </div>
            <p className="mb-2 font-medium text-ink/90">{t.short}</p>
            <p className="text-[14.5px] leading-relaxed text-muted">{t.long}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

import { Suspense, useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Clock } from 'lucide-react'
import { getAdjacent, getLesson, lessonKey } from '../lib/curriculum'
import { markDone, markUndone, useProgress } from '../lib/progress'
import { lessonComponents } from '../content'

export function LessonPage() {
  const { chapterId = '', lessonId = '' } = useParams()
  const found = getLesson(chapterId, lessonId)
  const progress = useProgress()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [chapterId, lessonId])

  if (!found) return <Navigate to="/" replace />
  const { chapter, lesson } = found
  const key = lessonKey(chapterId, lessonId)
  const done = progress.isDone(key)
  const Content = lessonComponents[key]
  const { prev, next } = getAdjacent(chapterId, lessonId)

  const lessonIndex = chapter.lessons.findIndex((l) => l.id === lessonId)

  return (
    <div className="mx-auto max-w-screen-2xl px-5 pb-24 pt-10 md:px-10 xl:px-14">
      {/* шапка урока */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <Link to="/" className="text-muted hover:text-ink">
            Курс
          </Link>
          <span className="text-muted/50">/</span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <chapter.icon className="size-3.5" /> {chapter.title}
          </span>
          <span className="text-muted/50">/</span>
          <span className="text-accent">
            Урок {lessonIndex + 1} из {chapter.lessons.length}
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-title md:text-4xl">{lesson.title}</h1>
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="chip">
            <Clock className="size-3.5" /> ~{lesson.minutes} мин
          </span>
          <span className="chip">{chapter.week}</span>
          <span className="text-sm text-muted">{lesson.description}</span>
        </div>
      </motion.div>

      {/* контент */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-muted">
            <div className="animate-pulse">Загружаем урок…</div>
          </div>
        }
      >
        {Content ? <Content /> : <div className="card p-8 text-muted">Урок в разработке.</div>}
      </Suspense>

      {/* отметка о прохождении */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => (done ? markUndone(key) : markDone(key))}
          className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition-all ${
            done
              ? 'border-good/60 bg-good/10 text-good'
              : 'border-line bg-surface-2 text-ink hover:border-good/60 hover:text-good'
          }`}
        >
          <Check className="size-5" />
          {done ? 'Урок пройден' : 'Отметить как пройденный'}
        </button>
      </div>

      {/* навигация */}
      <div className="mt-10 grid grid-cols-1 gap-3 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <Link
            to={`/${prev.chapter.id}/${prev.lesson.id}`}
            className="card group flex items-center gap-3 p-4 transition-colors hover:border-violet/50"
          >
            <ArrowLeft className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-x-1" />
            <div className="min-w-0">
              <div className="text-xs text-muted">Назад</div>
              <div className="truncate text-sm font-semibold text-ink">{prev.lesson.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next && (
          <Link
            to={`/${next.chapter.id}/${next.lesson.id}`}
            className="card group flex items-center justify-end gap-3 p-4 text-right transition-colors hover:border-violet/50"
            onClick={() => markDone(key)}
          >
            <div className="min-w-0">
              <div className="text-xs text-muted">Дальше</div>
              <div className="truncate text-sm font-semibold text-ink">{next.lesson.title}</div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </div>
  )
}

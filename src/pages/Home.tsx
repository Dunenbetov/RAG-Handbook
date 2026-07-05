import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookMarked, Gamepad2, GraduationCap, ListChecks, Lock } from 'lucide-react'
import { chapters, isChapterLocked, lessonKey } from '../lib/curriculum'
import { useProgress } from '../lib/progress'

// three.js тяжёлый — грузим фон отдельным чанком, страница работает и без него
const HeroBackdrop = lazy(() => import('../components/three/HeroBackdrop'))

/** 83 → «~1 ч 25 мин», 28 → «~30 мин» (минуты округляем до 5) */
function formatMinutes(total: number) {
  const rounded = Math.round(total / 5) * 5
  if (rounded < 60) return `~${rounded} мин`
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m > 0 ? `~${h} ч ${m} мин` : `~${h} ч`
}

const features = [
  { icon: <Gamepad2 className="size-5 text-accent" />, title: '10 интерактивных симуляторов', text: 'Chunking, эмбеддинги, hybrid search, RAGAS и граф знаний — всё можно потрогать руками.' },
  { icon: <GraduationCap className="size-5 text-violet" />, title: 'От нуля до практики', text: 'Никаких предварительных знаний: начинаем с «что такое LLM», заканчиваем гидом по своему проекту.' },
  { icon: <ListChecks className="size-5 text-good" />, title: 'Квизы и чек-листы', text: 'После каждой главы — проверка себя. Перед стартом проекта — итоговый чек-лист.' },
  { icon: <BookMarked className="size-5 text-warn" />, title: 'Глоссарий на 55+ терминов', text: 'Каждый термин в тексте кликабелен — определение всегда под рукой.' },
]

export function Home() {
  const progress = useProgress()

  // первый непройденный урок — для кнопки «продолжить»
  const nextLesson = chapters
    .flatMap((c) => c.lessons.map((l) => ({ c, l, key: lessonKey(c.id, l.id) })))
    .find((x) => !progress.isDone(x.key))

  return (
    <div className="relative overflow-hidden">
      {/* фон на всю ширину страницы — растворяется маской, а не обрезается краем героя */}
      <Suspense fallback={null}>
        <HeroBackdrop />
      </Suspense>

      <div className="relative mx-auto max-w-5xl px-5 pb-24 md:px-8">
      {/* герой */}
      <div className="relative py-16 md:py-24">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-violet/15 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative text-center">
          <div className="chip mx-auto mb-6 w-fit">Интерактивный учебник · RAG</div>
          <h1 className="mx-auto mb-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-title md:text-6xl">
            Как на самом деле работает <span className="gradient-text">RAG</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted">
            От основ RAG и продвинутых техник до оценивания качества через RAGAS и GraphRAG.
            Пошагово, с анимациями и симуляторами — а в конце практический гид по своему проекту.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {nextLesson ? (
              <Link to={`/${nextLesson.c.id}/${nextLesson.l.id}`} className="btn-primary text-base">
                {progress.count > 0 ? 'Продолжить обучение' : 'Начать с нуля'} <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link to="/ch4/checklist" className="btn-primary text-base">
                Курс пройден — к чек-листу! <ArrowRight className="size-4" />
              </Link>
            )}
            <Link to="/glossary" className="btn-ghost text-base">
              Глоссарий
            </Link>
          </div>
          {progress.count > 0 && (
            <div className="mx-auto mt-8 max-w-sm">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>
                  Пройдено {progress.count} из {progress.total} уроков
                </span>
                <span className="font-semibold text-accent">{progress.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <motion.div animate={{ width: `${progress.percent}%` }} className="h-full rounded-full bg-gradient-to-r from-accent to-violet" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* фичи */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="card p-5"
          >
            <div className="mb-2 flex items-center gap-2.5 font-semibold text-title">
              {f.icon}
              {f.title}
            </div>
            <p className="text-[14.5px] leading-relaxed text-muted">{f.text}</p>
          </motion.div>
        ))}
      </div>

      {/* путь обучения */}
      <h2 className="mb-6 text-2xl font-bold text-title">Путь обучения</h2>
      <div className="space-y-4">
        {chapters.map((chapter, i) => {
          const doneCount = chapter.lessons.filter((l) => progress.isDone(lessonKey(chapter.id, l.id))).length
          const pct = Math.round((doneCount / chapter.lessons.length) * 100)
          const locked = isChapterLocked(chapter.id, progress.done)

          const inner = (
            <>
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
                  locked ? 'bg-surface-2' : 'bg-gradient-to-br from-accent/15 to-violet/15'
                }`}
              >
                {locked ? <Lock className="size-6 text-muted" /> : <chapter.icon className="size-7 text-accent" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="chip">{chapter.week}</span>
                  <h3 className={`text-lg font-bold ${locked ? 'text-muted' : 'text-title'}`}>{chapter.title}</h3>
                </div>
                {locked ? (
                  <p className="text-sm text-muted">Откроется, когда пройдёшь остальные главы</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-muted">{chapter.subtitle}</p>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full ${pct === 100 ? 'bg-good' : 'bg-gradient-to-r from-accent to-violet'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted">
                        {doneCount}/{chapter.lessons.length} уроков · {formatMinutes(chapter.lessons.reduce((s, l) => s + l.minutes, 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {!locked && (
                <ArrowRight className="hidden size-5 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent md:block" />
              )}
            </>
          )

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              {locked ? (
                <div className="card flex cursor-not-allowed flex-col gap-4 p-6 opacity-60 md:flex-row md:items-center">
                  {inner}
                </div>
              ) : (
                <Link
                  to={`/${chapter.id}/${chapter.lessons[0].id}`}
                  className="card group flex flex-col gap-4 p-6 transition-all hover:border-violet/50 hover:shadow-lg hover:shadow-violet/10 md:flex-row md:items-center"
                >
                  {inner}
                </Link>
              )}
            </motion.div>
          )
        })}
      </div>
      </div>
    </div>
  )
}

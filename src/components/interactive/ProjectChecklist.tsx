import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  points?: number
}

interface ChecklistGroup {
  title: string
  maxPoints: number
  items: ChecklistItem[]
}

const GROUPS: ChecklistGroup[] = [
  {
    title: 'Задание 1A · Naive RAG (20 баллов)',
    maxPoints: 20,
    items: [
      { id: 'parse', text: 'Оба PDF распарсены Visual Layout инструментом (Docling / Unstructured / LlamaParse)' },
      { id: 'tables-md', text: 'Таблицы преобразованы в Markdown/JSON; у разбитых таблиц заголовок продублирован в каждом чанке' },
      { id: 'naive-chunk', text: 'Naive chunking: 1024 токена, overlap 200' },
      { id: 'embed-db', text: 'Эмбеддинги multilingual-модели (e5-large) загружены в векторную БД' },
      { id: 'dense', text: 'Dense retrieval по косинусному сходству работает' },
      { id: 'llm-gen', text: 'LLM генерирует ответы по найденному контексту' },
      { id: 'manual-test', text: 'Протестировано на 5–10 вопросах вручную, типичные ошибки зафиксированы в ноутбуке' },
    ],
  },
  {
    title: 'Задание 1B · Advanced RAG (30 баллов)',
    maxPoints: 30,
    items: [
      { id: 'chunk3', text: 'Реализованы и сравнены 3 стратегии чанкинга: Fixed, Recursive, Layout-Aware' },
      { id: 'hybrid', text: 'Hybrid Search: Vector + BM25 объединены через RRF' },
      { id: 'rerank', text: 'Cross-Encoder reranking (bge-reranker-v2-m3), показаны результаты до/после' },
      { id: 'preretr', text: 'Одна pre-retrieval техника: Query Rewriting / HyDE / Query Routing' },
      { id: 'justify', text: 'Каждое улучшение обосновано и показана разница с Naive RAG' },
    ],
  },
  {
    title: 'Задание 2A · Эксперименты (30 баллов)',
    maxPoints: 30,
    items: [
      { id: 'exp6', text: 'Проведено минимум 6 экспериментов (greedy search, один параметр за раз)' },
      { id: 'exp-desc', text: 'Для каждого эксперимента указано: какой параметр изменён и какое значение выставлено' },
      { id: 'exp-golden', text: 'Каждый эксперимент прогнан на всём Golden Dataset' },
      { id: 'exp-metrics', text: 'Записаны все 4 RAGAS-метрики по каждому эксперименту' },
      { id: 'exp-conclusion', text: 'По каждому эксперименту написан вывод: лучше/хуже и почему' },
    ],
  },
  {
    title: 'Задание 2B · RAGAS и итоговый вывод (20 баллов)',
    maxPoints: 20,
    items: [
      { id: 'final-table', text: 'Итоговая таблица всех экспериментов, отмечены лучшие и худшие результаты' },
      { id: 'metric-analysis', text: 'По каждой метрике: среднее, интерпретация и 2–3 конкретных примера вопросов' },
      { id: 'final-md', text: 'Markdown-ячейка «Итоговый вывод» отвечает на все 6 вопросов ТЗ (лучшая комбинация, самый влиятельный параметр, alpha, reranking, сложные вопросы)' },
    ],
  },
  {
    title: 'Бонус · GraphRAG (+30 баллов)',
    maxPoints: 30,
    items: [
      { id: 'neo4j', text: 'Neo4j развёрнут (Docker или Aura Free)' },
      { id: 'entities', text: 'Извлечены сущности и связи (компании, показатели, проекты, даты)' },
      { id: 'cypher', text: 'Показаны примеры Cypher-запросов с результатами' },
      { id: 'graph-vs-vector', text: 'Таблица сравнения GraphRAG vs Vector RAG на одних вопросах' },
      { id: 'graph-conclusion', text: 'Вывод: когда GraphRAG лучше, а когда нет' },
    ],
  },
  {
    title: 'Оформление сдачи',
    maxPoints: 0,
    items: [
      { id: 'notebook', text: 'Jupyter Notebook с пояснениями, визуализациями и результатами' },
      { id: 'readme', text: 'README.md: архитектура, схема пайплайна, инструкция запуска' },
      { id: 'deadline', text: 'Уложился в срок (2 недели, до 8 июля)' },
    ],
  },
]

const STORAGE_KEY = 'rag-conspect-checklist-v1'

export function ProjectChecklist() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return new Set(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
    } catch {
      // localStorage недоступен
    }
  }, [checked])

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // баллы: пропорционально закрытым пунктам группы
  const earned = GROUPS.reduce((sum, g) => {
    const done = g.items.filter((i) => checked.has(i.id)).length
    return sum + (g.maxPoints * done) / g.items.length
  }, 0)

  const totalItems = GROUPS.reduce((s, g) => s + g.items.length, 0)
  const doneItems = [...checked].filter((id) => GROUPS.some((g) => g.items.some((i) => i.id === id))).length

  return (
    <div className="my-8">
      {/* счётчик баллов */}
      <div className="card sticky top-14 z-10 mb-5 flex items-center gap-4 p-4 backdrop-blur lg:top-2">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-line)" strokeWidth="6" />
            <motion.circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="url(#checklist-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 27}
              animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - earned / 130) }}
            />
            <defs>
              <linearGradient id="checklist-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[13px] font-bold text-title">{Math.round(earned)}</span>
        </div>
        <div>
          <div className="font-bold text-title">
            ~{Math.round(earned)} из 130 баллов
          </div>
          <div className="text-sm text-muted">
            Закрыто {doneItems} из {totalItems} пунктов. Оценка примерная — пропорциональна пунктам внутри каждой части ТЗ.
          </div>
        </div>
      </div>

      {GROUPS.map((group) => {
        const done = group.items.filter((i) => checked.has(i.id)).length
        return (
          <div key={group.title} className="card mb-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
              <span className="text-sm font-semibold text-title">{group.title}</span>
              <span className={`text-xs font-bold ${done === group.items.length ? 'text-good' : 'text-muted'}`}>
                {done}/{group.items.length}
              </span>
            </div>
            <div className="divide-y divide-line/40">
              {group.items.map((item) => {
                const isChecked = checked.has(item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-2/50"
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isChecked ? 'border-good bg-good text-bg' : 'border-line'
                      }`}
                    >
                      {isChecked && <Check className="size-3.5" />}
                    </span>
                    <span className={`text-[14px] leading-relaxed ${isChecked ? 'text-muted line-through decoration-line' : 'text-ink/90'}`}>
                      {item.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

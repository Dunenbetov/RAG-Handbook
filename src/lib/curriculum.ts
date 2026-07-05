import type { LucideIcon } from 'lucide-react'
import { BarChart3, Blocks, Rocket, Sprout, Trophy } from 'lucide-react'

export interface LessonMeta {
  id: string
  title: string
  description: string
  minutes: number
}

export interface Chapter {
  id: string
  num: number
  title: string
  subtitle: string
  week: string
  icon: LucideIcon
  lessons: LessonMeta[]
}

export const chapters: Chapter[] = [
  {
    id: 'ch0',
    num: 0,
    title: 'Старт с нуля',
    subtitle: 'Что такое LLM, почему они ошибаются и зачем придумали RAG',
    week: 'Пролог',
    icon: Sprout,
    lessons: [
      { id: 'llm', title: 'Что такое LLM простыми словами', description: 'Как устроена языковая модель и что она умеет', minutes: 7 },
      { id: 'problem', title: 'Почему LLM уверенно ошибается', description: 'Knowledge cutoff, галлюцинации и приватные данные', minutes: 8 },
      { id: 'rag-idea', title: 'RAG: открытая книга на экзамене', description: 'Главная идея Retrieval-Augmented Generation', minutes: 8 },
      { id: 'quiz', title: 'Квиз: проверь себя', description: 'Закрепляем базу перед погружением', minutes: 5 },
    ],
  },
  {
    id: 'ch1',
    num: 1,
    title: 'Основы RAG',
    subtitle: 'Пайплайн от документа до ответа: chunking, эмбеддинги, векторные БД, поиск',
    week: 'Неделя 11',
    icon: Blocks,
    lessons: [
      { id: 'pipeline', title: 'Анатомия RAG-пайплайна', description: 'Шесть этапов: от документов до ответа', minutes: 10 },
      { id: 'chunking', title: 'Chunking: режем документы правильно', description: 'Fixed, sliding window, recursive, semantic + симулятор', minutes: 12 },
      { id: 'embeddings', title: 'Эмбеддинги и косинусное сходство', description: 'Как текст превращается в числа + визуализация', minutes: 12 },
      { id: 'vector-db', title: 'Векторные базы данных', description: 'ChromaDB, Pinecone, Qdrant и как работает HNSW', minutes: 10 },
      { id: 'retrieval', title: 'Поиск: Dense, BM25 и Hybrid', description: 'Почему «Статья 150» ломает семантический поиск', minutes: 12 },
      { id: 'metrics', title: 'Метрики качества поиска', description: 'Hit Rate, Recall@k, Precision@k и MRR', minutes: 9 },
      { id: 'seminar', title: 'Семинар: RAG-юрист по кодексам РК', description: 'Реальный пайплайн недели 11 в коде', minutes: 12 },
      { id: 'quiz', title: 'Квиз: основы RAG', description: 'Вопросы уровня собеседования', minutes: 6 },
    ],
  },
  {
    id: 'ch2',
    num: 2,
    title: 'Advanced RAG',
    subtitle: 'Что делать, когда наивный RAG не справляется: 6 техник улучшения',
    week: 'Неделя 12',
    icon: Rocket,
    lessons: [
      { id: 'naive-problems', title: 'Где ломается Naive RAG', description: 'Разорванные таблицы, потерянные названия, перепутанные цифры', minutes: 8 },
      { id: 'pre-retrieval', title: 'Pre-Retrieval: улучшаем запрос', description: 'Query Rewriting, HyDE и Query Routing', minutes: 10 },
      { id: 'parent-child', title: 'Parent-Child: ищем мелко, читаем крупно', description: 'Иерархический retrieval + анимация small-to-big', minutes: 10 },
      { id: 'hybrid-rrf', title: 'Hybrid Search и RRF', description: 'Объединяем BM25 и векторы + калькулятор RRF', minutes: 12 },
      { id: 'reranking', title: 'Reranking: второй взгляд на результаты', description: 'Bi-encoder vs Cross-encoder, до и после', minutes: 9 },
      { id: 'colpali', title: 'ColPali: RAG, который видит', description: 'Vision-модели для документов с таблицами и графиками', minutes: 9 },
      { id: 'comparison', title: 'Семинар: Naive vs Advanced в цифрах', description: 'Реальное сравнение на годовом отчёте «Рахат»', minutes: 10 },
      { id: 'quiz', title: 'Квиз: Advanced RAG', description: 'Проверяем продвинутые техники', minutes: 6 },
    ],
  },
  {
    id: 'ch3',
    num: 3,
    title: 'Оценивание и GraphRAG',
    subtitle: 'Как измерить качество RAG числами и когда графы лучше векторов',
    week: 'Неделя 13',
    icon: BarChart3,
    lessons: [
      { id: 'why-eval', title: 'Зачем измерять качество RAG', description: 'Где именно ломается пайплайн и как это увидеть', minutes: 8 },
      { id: 'ragas', title: '4 метрики RAGAS', description: 'Faithfulness, Answer Relevancy, Context Recall/Precision + playground', minutes: 14 },
      { id: 'ragas-code', title: 'RAGAS в коде', description: 'EvaluationDataset, LLM-судья и запуск оценки', minutes: 10 },
      { id: 'pipeline-testing', title: 'Тестируем каждый этап пайплайна', description: 'Visual LLM для парсинга, coherence и independence для чанков', minutes: 11 },
      { id: 'graphrag', title: 'GraphRAG: знания как граф', description: 'Neo4j, Cypher, multi-hop вопросы + интерактивный граф', minutes: 14 },
      { id: 'quiz', title: 'Квиз: оценивание и GraphRAG', description: 'Финальная проверка теории', minutes: 6 },
    ],
  },
  {
    id: 'ch4',
    num: 4,
    title: 'Гид по практическому проекту',
    subtitle: 'Пошаговый план: как применить RAG в своём проекте, от плана до чек-листа',
    week: 'Проект',
    icon: Trophy,
    lessons: [
      { id: 'overview', title: 'Разбор ТЗ: за что дают баллы', description: 'Структура заданий, данные и требования', minutes: 10 },
      { id: 'plan', title: 'План работ по шагам', description: 'От парсинга PDF до итогового вывода', minutes: 12 },
      { id: 'experiments', title: 'Эксперименты: greedy search', description: 'Как варьировать гиперпараметры + интерактивный планировщик', minutes: 12 },
      { id: 'bonus-graphrag', title: 'Бонус: GraphRAG на +30 баллов', description: 'Neo4j, извлечение сущностей и сравнение с Vector RAG', minutes: 10 },
      { id: 'pitfalls', title: 'Ловушки и советы на высший балл', description: 'Что реально оценивают и где все теряют баллы', minutes: 9 },
      { id: 'checklist', title: 'Чек-лист сдачи', description: 'Интерактивный список на 130 баллов', minutes: 5 },
    ],
  },
]

export function getChapter(chapterId: string): Chapter | undefined {
  return chapters.find((c) => c.id === chapterId)
}

export function getLesson(chapterId: string, lessonId: string) {
  const chapter = getChapter(chapterId)
  const lesson = chapter?.lessons.find((l) => l.id === lessonId)
  return chapter && lesson ? { chapter, lesson } : undefined
}

export function lessonKey(chapterId: string, lessonId: string) {
  return `${chapterId}/${lessonId}`
}

/** Глава-«гид по проекту» открывается только после прохождения всех остальных глав */
export function isChapterLocked(chapterId: string, done: Set<string>) {
  if (chapterId !== 'ch4') return false
  return chapters
    .filter((c) => c.id !== 'ch4')
    .some((c) => c.lessons.some((l) => !done.has(lessonKey(c.id, l.id))))
}

/** Плоский список всех уроков в порядке прохождения */
export const allLessons = chapters.flatMap((c) =>
  c.lessons.map((l) => ({ chapter: c, lesson: l, key: lessonKey(c.id, l.id) })),
)

export function getAdjacent(chapterId: string, lessonId: string) {
  const idx = allLessons.findIndex((x) => x.key === lessonKey(chapterId, lessonId))
  return {
    prev: idx > 0 ? allLessons[idx - 1] : undefined,
    next: idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : undefined,
  }
}

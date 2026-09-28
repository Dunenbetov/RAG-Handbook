import type { LucideIcon } from 'lucide-react'
import { Activity, AudioLines, BarChart3, Blocks, Cable, Network, Presentation, Rocket, Sprout, Trophy, Workflow } from 'lucide-react'

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
    week: 'Модуль 1',
    icon: Blocks,
    lessons: [
      { id: 'pipeline', title: 'Анатомия RAG-пайплайна', description: 'Шесть этапов: от документов до ответа', minutes: 10 },
      { id: 'chunking', title: 'Chunking: режем документы правильно', description: 'Fixed, sliding window, recursive, semantic + симулятор', minutes: 12 },
      { id: 'embeddings', title: 'Эмбеддинги и косинусное сходство', description: 'Как текст превращается в числа + визуализация', minutes: 12 },
      { id: 'vector-db', title: 'Векторные базы данных', description: 'ChromaDB, Pinecone, Qdrant и как работает HNSW', minutes: 10 },
      { id: 'retrieval', title: 'Поиск: Dense, BM25 и Hybrid', description: 'Почему «Статья 150» ломает семантический поиск', minutes: 12 },
      { id: 'metrics', title: 'Метрики качества поиска', description: 'Hit Rate, Recall@k, Precision@k и MRR', minutes: 9 },
      { id: 'seminar', title: 'Семинар: RAG-юрист по кодексам РК', description: 'Собираем настоящий пайплайн в коде', minutes: 12 },
      { id: 'quiz', title: 'Квиз: основы RAG', description: 'Вопросы уровня собеседования', minutes: 6 },
    ],
  },
  {
    id: 'ch2',
    num: 2,
    title: 'Advanced RAG',
    subtitle: 'Что делать, когда наивный RAG не справляется: 6 техник улучшения',
    week: 'Модуль 2',
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
    week: 'Модуль 3',
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
    title: 'Гид по Project 4',
    subtitle: 'Пошаговый план RAG-проекта: от парсинга PDF до чек-листа сдачи',
    week: 'Проект 4',
    icon: Trophy,
    lessons: [
      { id: 'overview', title: 'С чего начать свой проект', description: 'Постановка задачи, данные и требования к результату', minutes: 10 },
      { id: 'plan', title: 'План работ по шагам', description: 'От парсинга PDF до итогового вывода', minutes: 12 },
      { id: 'experiments', title: 'Эксперименты: greedy search', description: 'Как варьировать гиперпараметры + интерактивный планировщик', minutes: 12 },
      { id: 'bonus-graphrag', title: 'Бонус: добавляем GraphRAG', description: 'Neo4j, извлечение сущностей и сравнение с Vector RAG', minutes: 10 },
      { id: 'pitfalls', title: 'Ловушки и советы', description: 'Где чаще всего теряют качество и как этого избежать', minutes: 9 },
      { id: 'checklist', title: 'Итоговый чек-лист', description: 'Интерактивный список: ничего не забыть перед релизом', minutes: 5 },
    ],
  },
  {
    id: 'ch5',
    num: 5,
    title: 'MCP: USB-C для AI',
    subtitle: 'Model Context Protocol — как LLM подключаются к инструментам, данным и браузеру',
    week: 'Модуль 4',
    icon: Cable,
    lessons: [
      { id: 'why-mcp', title: 'Зачем нужен MCP', description: 'Мир до MCP, проблема N×M и идея «одного разъёма»', minutes: 10 },
      { id: 'architecture', title: 'Host, Client, Server', description: 'Архитектура MCP, STDIO и Streamable HTTP', minutes: 11 },
      { id: 'primitives', title: 'Tools, Resources, Prompts', description: 'Три примитива протокола и когда что использовать', minutes: 10 },
      { id: 'tool-flow', title: 'Жизненный цикл tool call', description: 'JSON-RPC: от запроса LLM до ответа сервера', minutes: 11 },
      { id: 'using-servers', title: 'Готовые MCP-серверы', description: 'Context7, Chrome DevTools, Playwright — подключение и use-cases', minutes: 12 },
      { id: 'fastmcp', title: 'Свой сервер на FastMCP', description: 'Пишем tools, resources и prompts на Python', minutes: 12 },
      { id: 'skills-ace', title: 'Skills и Context Engineering', description: 'MCP + Skills + ACE: как агент учится работать лучше', minutes: 10 },
      { id: 'seminar', title: 'Семинар: planner-агент', description: 'Weather + Playwright + notes → единый агент', minutes: 14 },
      { id: 'quiz', title: 'Квиз: MCP', description: 'Проверяем понимание протокола', minutes: 6 },
    ],
  },
  {
    id: 'ch6',
    num: 6,
    title: 'Мультимодальные агенты',
    subtitle: 'Image, Audio, Video и склейка модальностей в Gradio-агента',
    week: 'Модуль 5',
    icon: AudioLines,
    lessons: [
      { id: 'modalities-map', title: 'Карта модальностей', description: 'Input → Brain → Output: как устроен мультимодальный агент', minutes: 9 },
      { id: 'image-models', title: 'Image-модели', description: '4 класса задач: VLM, генерация, редактирование, LoRA', minutes: 12 },
      { id: 'audio-models', title: 'Audio-модели', description: 'ASR, diarization, TTS и voice clone', minutes: 13 },
      { id: 'video-models', title: 'Video-модели', description: 'T2V, I2V, keyframes и fal.ai / Replicate', minutes: 11 },
      { id: 'gradio-agents', title: 'Gradio-агенты', description: 'Склеиваем ASR → LLM → TTS → Avatar в UI', minutes: 12 },
      { id: 'cost-routing', title: 'Стоимость и routing', description: 'detail:low, кэш, model routing — не сжечь бюджет', minutes: 10 },
      { id: 'seminar', title: 'Семинар: voice-to-avatar', description: 'От голосового ввода до видео с аватаром', minutes: 12 },
      { id: 'quiz', title: 'Квиз: мультимодальность', description: 'Проверяем модальности и пайплайны', minutes: 6 },
    ],
  },
  {
    id: 'ch7',
    num: 7,
    title: 'Гид по Project 5',
    subtitle: 'AI Avatar Agent: рестораны Алматы, MCP, vision, voice clone и говорящий аватар',
    week: 'Проект 5',
    icon: Trophy,
    lessons: [
      { id: 'overview', title: 'ТЗ и баллы', description: 'Что сдаём, за что начисляют 100+10 баллов', minutes: 10 },
      { id: 'mcp-plan', title: 'MCP-серверы 2GIS и Chocolife', description: 'Парсинг через Playwright MCP, stdio/SSE', minutes: 12 },
      { id: 'agent-brain', title: 'LLM + tools + memory + vision', description: 'Мозг агента: tool calling и сессионная память', minutes: 11 },
      { id: 'voice-avatar', title: 'Voice clone и Avatar video', description: 'MiniMax TTS + Creatify Aurora / Kling Avatar', minutes: 12 },
      { id: 'critic-skill', title: 'Skill «Ресторанный критик»', description: 'Custom tool analyze_restaurant_photo', minutes: 9 },
      { id: 'pitfalls', title: 'Отладка и бюджет', description: 'Порядок отладки, моки, ~$15–20 на проект', minutes: 10 },
      { id: 'checklist', title: 'Чек-лист сдачи', description: 'Интерактивный список по рубрике Project 5', minutes: 5 },
    ],
  },
  {
    id: 'ch8',
    num: 8,
    title: 'Агенты на LangGraph',
    subtitle: 'StateGraph, циклы, tool calling, self-reflection и human-in-the-loop',
    week: 'Модуль 6',
    icon: Workflow,
    lessons: [
      { id: 'workflow-vs-agent', title: 'Workflow или агент', description: 'От цепочки к графу, 5 паттернов Anthropic, когда граф не нужен', minutes: 9 },
      { id: 'stategraph', title: 'StateGraph: состояние, узлы, рёбра', description: 'Reducers, conditional edges, Command + пошаговый прогон', minutes: 12 },
      { id: 'tools-reflection', title: 'Tool calling и self-reflection', description: 'ReAct в графе, ToolNode, критик и лимит итераций', minutes: 11 },
      { id: 'hitl', title: 'Checkpointer и human-in-the-loop', description: 'interrupt, Command(resume), thread_id, time travel', minutes: 12 },
      { id: 'seminar-ace', title: 'Семинар: self-evolving OSINT-агент', description: 'ACE: Generator → Reflector → Curator', minutes: 10 },
      { id: 'quiz', title: 'Квиз: LangGraph', description: 'Графы, состояние и HITL', minutes: 6 },
    ],
  },
  {
    id: 'ch9',
    num: 9,
    title: 'LLMOps: трейсинг и evals',
    subtitle: 'Langfuse, LangSmith, Phoenix, golden dataset, LLM-as-judge и честные A/B',
    week: 'Модуль 7',
    icon: Activity,
    lessons: [
      { id: 'observability', title: 'LLMOps и observability', description: 'Цикл LLMOps, OpenTelemetry, OpenInference', minutes: 8 },
      { id: 'traces', title: 'Trace, span, generation, session', description: 'Анатомия трейса + интерактивное дерево', minutes: 11 },
      { id: 'tools', title: 'Langfuse, LangSmith, Phoenix', description: 'Интеграция в коде и типичные ошибки', minutes: 11 },
      { id: 'evals', title: 'Golden dataset и LLM-as-judge', description: 'Offline/online evals, метрики, смещения судьи', minutes: 12 },
      { id: 'ab-testing', title: 'A/B-эксперименты без самообмана', description: 'Шум, доверительный интервал, базовые уровни + калькулятор', minutes: 11 },
      { id: 'quiz', title: 'Квиз: LLMOps', description: 'Трейсы, evals и эксперименты', minutes: 6 },
    ],
  },
  {
    id: 'ch10',
    num: 10,
    title: 'Agentic RAG и мультиагенты',
    subtitle: 'Context engineering, structured output, A2A и Extractor-агент',
    week: 'Модуль 8',
    icon: Network,
    lessons: [
      { id: 'context-engineering', title: 'Context engineering', description: 'Write/Select/Compress/Isolate, память, context rot', minutes: 9 },
      { id: 'agentic-rag', title: 'Advanced vs Agentic RAG', description: 'ReAct-поиск, CRAG, Self-RAG, query rewriting', minutes: 10 },
      { id: 'structured-output', title: 'Structured output и извлечение', description: 'strict JSON Schema, Pydantic/Zod, валидация и retry', minutes: 10 },
      { id: 'multi-agent-a2a', title: 'Мультиагенты и протокол A2A', description: 'Топологии, когда не нужны, MCP vs A2A vs LangGraph', minutes: 11 },
      { id: 'seminar-extractor', title: 'Семинар: Extractor-агент', description: 'Калибровка → эскалация: VLM-судья на 3 страницах', minutes: 10 },
      { id: 'quiz', title: 'Квиз: Agentic RAG', description: 'Контекст, агенты и протоколы', minutes: 6 },
    ],
  },
  {
    id: 'ch11',
    num: 11,
    title: 'Защита Final Project',
    subtitle: 'RemarkRound на Demo Day: рубрика, архитектура, цифры и трудные вопросы',
    week: 'Demo Day',
    icon: Presentation,
    lessons: [
      { id: 'rubric', title: 'ТЗ, рубрика и питч за 10 минут', description: 'Что оценивают менторы и как построить рассказ', minutes: 8 },
      { id: 'request-path', title: 'Путь одного замечания', description: 'Граф triage от ingest до persist — пошагово', minutes: 10 },
      { id: 'concept-map', title: 'Концепты курса в remark-round', description: 'Каждый модуль ТЗ → файл в репозитории', minutes: 9 },
      { id: 'metrics-story', title: 'Метрики и A/B: честные цифры', description: 'Что говорить про golden, шум и цену', minutes: 10 },
      { id: 'hard-questions', title: 'Вопросы-ловушки', description: 'Флеш-карты: где агент, почему не long context и др.', minutes: 12 },
      { id: 'quiz', title: 'Финальный квиз', description: 'Сквозная проверка перед защитой', minutes: 8 },
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

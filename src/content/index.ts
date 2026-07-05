import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Реестр уроков: ключ `chapterId/lessonId` → lazy-компонент.
 * Каждый файл урока default-экспортирует React-компонент без пропсов.
 */
export const lessonComponents: Record<string, LazyExoticComponent<ComponentType>> = {
  'ch0/llm': lazy(() => import('./ch0/llm')),
  'ch0/problem': lazy(() => import('./ch0/problem')),
  'ch0/rag-idea': lazy(() => import('./ch0/rag-idea')),
  'ch0/quiz': lazy(() => import('./ch0/quiz')),

  'ch1/pipeline': lazy(() => import('./ch1/pipeline')),
  'ch1/chunking': lazy(() => import('./ch1/chunking')),
  'ch1/embeddings': lazy(() => import('./ch1/embeddings')),
  'ch1/vector-db': lazy(() => import('./ch1/vector-db')),
  'ch1/retrieval': lazy(() => import('./ch1/retrieval')),
  'ch1/metrics': lazy(() => import('./ch1/metrics')),
  'ch1/seminar': lazy(() => import('./ch1/seminar')),
  'ch1/quiz': lazy(() => import('./ch1/quiz')),

  'ch2/naive-problems': lazy(() => import('./ch2/naive-problems')),
  'ch2/pre-retrieval': lazy(() => import('./ch2/pre-retrieval')),
  'ch2/parent-child': lazy(() => import('./ch2/parent-child')),
  'ch2/hybrid-rrf': lazy(() => import('./ch2/hybrid-rrf')),
  'ch2/reranking': lazy(() => import('./ch2/reranking')),
  'ch2/colpali': lazy(() => import('./ch2/colpali')),
  'ch2/comparison': lazy(() => import('./ch2/comparison')),
  'ch2/quiz': lazy(() => import('./ch2/quiz')),

  'ch3/why-eval': lazy(() => import('./ch3/why-eval')),
  'ch3/ragas': lazy(() => import('./ch3/ragas')),
  'ch3/ragas-code': lazy(() => import('./ch3/ragas-code')),
  'ch3/pipeline-testing': lazy(() => import('./ch3/pipeline-testing')),
  'ch3/graphrag': lazy(() => import('./ch3/graphrag')),
  'ch3/quiz': lazy(() => import('./ch3/quiz')),

  'ch4/overview': lazy(() => import('./ch4/overview')),
  'ch4/plan': lazy(() => import('./ch4/plan')),
  'ch4/experiments': lazy(() => import('./ch4/experiments')),
  'ch4/bonus-graphrag': lazy(() => import('./ch4/bonus-graphrag')),
  'ch4/pitfalls': lazy(() => import('./ch4/pitfalls')),
  'ch4/checklist': lazy(() => import('./ch4/checklist')),
}

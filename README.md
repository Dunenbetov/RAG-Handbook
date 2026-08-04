# LLM-Engineer Handbook — интерактивный сайт-конспект

Конспект курса **LLM-Engineer** от nFactorial School: недели 11–19 + гиды по Project 4 и Project 5.
Для человека, который не смотрел ни одной лекции — от «что такое LLM» до мультимодального агента с аватаром и MCP.

## Запуск

```bash
cd "RAG Handbook"
npm install
npm run dev        # → http://localhost:5173
```

Продакшн-сборка: `npm run build` (результат в `dist/`, чистая статика — откроется с любого хостинга).

## Что внутри

- **8 глав, 56 уроков**: Старт с нуля → RAG (нед. 11) → Advanced RAG (нед. 12) → Оценивание и GraphRAG (нед. 13) → Project 4 → MCP (нед. 14–15) → Мультимодальность (нед. 16–19) → Project 5
- **17 интерактивных симуляторов**: чанкинг, эмбеддинги, hybrid search, RAGAS, граф знаний, MCP N×M, topology, tool call flow, ASR→TTS, video routing, чек-листы проектов
- **Квизы** после каждой главы с объяснениями ответов
- **Глоссарий** на 80+ терминов с поиском; термины кликабельны прямо в уроках
- **Прогресс** сохраняется в localStorage (пройденные уроки, результаты квизов, чек-листы)

## Стек

Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion (анимации), prism-react-renderer (код), lucide-react (иконки). Роутинг — HashRouter (работает и со статики без сервера).

## Структура

```
src/
  lib/          curriculum (главы/уроки), glossary, progress (localStorage)
  components/   ui-кит (Section, Callout, Analogy, ...), Sidebar, QuizBlock
    interactive/  17 симуляторов
  content/      ch0..ch7 — уроки как React-компоненты
  pages/        Home, LessonPage, GlossaryPage
```

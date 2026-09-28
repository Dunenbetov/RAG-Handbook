# LLM Handbook — интерактивный сайт-конспект

Конспект курса **LLM-Engineer** от nFactorial School: недели 11–22, гиды по Project 4 и Project 5 и подготовка к защите Final Project.
Для человека, который не смотрел ни одной лекции — от «что такое LLM» до агентов на LangGraph, evals и мультиагентных систем.

## Запуск

```bash
cd "RAG Handbook"
npm install
npm run dev        # → http://localhost:5173
```

Продакшн-сборка: `npm run build` (результат в `dist/`, чистая статика — откроется с любого хостинга).

## Деплой на Railway

Проект готов к деплою через Dockerfile (Node build → Caddy serve). Переменные окружения не нужны.

1. Закоммитьте и запушьте изменения в GitHub (`Dunenbetov/RAG-Handbook`).
2. В [Railway](https://railway.com): **New Project** → **Deploy from GitHub repo** → выберите репозиторий.
3. После успешного деплоя: **Settings** → **Networking** → **Generate Domain**.

Альтернатива через CLI:

```bash
railway login
railway init
railway up
```

## Что внутри

- **12 глав, 80 уроков**: Старт с нуля → RAG (нед. 11) → Advanced RAG (нед. 12) → Оценивание и GraphRAG (нед. 13) → Project 4 → MCP (нед. 14–15) → Мультимодальность (нед. 16–19) → Project 5 → Агенты на LangGraph (нед. 20) → LLMOps: трейсинг и evals (нед. 21) → Agentic RAG и мультиагенты (нед. 22) → Защита Final Project
- **20+ интерактивных симуляторов**: чанкинг, эмбеддинги, hybrid search, RAGAS, граф знаний, MCP N×M, tool call flow, ASR→TTS, video routing, пошаговые прогоны графов (StepPlayer), дерево трейса, A/B-калькулятор с доверительными интервалами, флеш-карты к защите, чек-листы проектов
- **Квизы** после каждой главы с объяснениями ответов
- **Глоссарий** на 100+ терминов с поиском; термины кликабельны прямо в уроках
- **Все главы открыты сразу**; прогресс сохраняется в localStorage (пройденные уроки, результаты квизов, чек-листы, флеш-карты)

## Стек

Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion (анимации), prism-react-renderer (код), lucide-react (иконки). Роутинг — HashRouter (работает и со статики без сервера).

## Структура

```
src/
  lib/          curriculum (главы/уроки), glossary, progress (localStorage)
  components/   ui-кит (Section, Callout, Analogy, ...), Sidebar, QuizBlock
    interactive/  симуляторы (StepPlayer — общий пошаговый проигрыватель)
  content/      ch0..ch11 — уроки как React-компоненты
  pages/        Home, LessonPage, GlossaryPage, ProfilePage
```

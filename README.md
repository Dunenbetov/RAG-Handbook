# RAG Handbook — интерактивный сайт-конспект

Конспект модуля №4 (RAG) курса **LLM-Engineer** от nFactorial School: недели 11–13 + гид по Project 4.
Для человека, который не смотрел ни одной лекции — от «что такое LLM» до плана сдачи проекта на 130 баллов.

## Запуск

```bash
cd "RAG Handbook"
npm install
npm run dev        # → http://localhost:5173
```

Продакшн-сборка: `npm run build` (результат в `dist/`, чистая статика — откроется с любого хостинга).

## Что внутри

- **5 глав, 32 урока**: Старт с нуля → Основы RAG (нед. 11) → Advanced RAG (нед. 12) → Оценивание и GraphRAG (нед. 13) → Гид по Project 4
- **10 интерактивных симуляторов**: чанкинг со слайдерами, 3D-пространство эмбеддингов, гибридный поиск с α-слайдером, RRF-калькулятор, анимированный пайплайн, parent-child демо, RAGAS-плейграунд, граф знаний с multi-hop обходом, планировщик экспериментов, чек-лист проекта
- **Квизы** после каждой главы с объяснениями ответов
- **Глоссарий** на 55+ терминов с поиском; термины кликабельны прямо в уроках
- **Прогресс** сохраняется в localStorage (пройденные уроки, результаты квизов, чек-лист)

## Стек

Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion (анимации), prism-react-renderer (код), lucide-react (иконки). Роутинг — HashRouter (работает и со статики без сервера).

## Структура

```
src/
  lib/          curriculum (главы/уроки), glossary, progress (localStorage)
  components/   ui-кит (Section, Callout, Analogy, ...), Sidebar, QuizBlock
    interactive/  10 симуляторов
  content/      ch0..ch4 — уроки как React-компоненты
  pages/        Home, LessonPage, GlossaryPage
```

import { Link } from 'react-router-dom'
import { Callout, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

const linkCls = 'text-accent hover:underline'

export default function Lesson() {
  return (
    <>
      <Section title="Advanced RAG: один фиксированный проход">
        <p>
          Advanced RAG — цепочка шагов, которая проходится ровно один раз: расширение запроса (
          <Link to="/ch2/pre-retrieval" className={linkCls}>
            HyDE, multi-query, step-back
          </Link>
          ) → dense + <Term id="bm25">BM25</Term> → слияние через{' '}
          <Link to="/ch2/hybrid-rrf" className={linkCls}>
            RRF
          </Link>{' '}
          →{' '}
          <Link to="/ch2/reranking" className={linkCls}>
            кросс-энкодер
          </Link>{' '}
          → генерация. Механика разобрана во второй главе, здесь важно одно ограничение: <strong>если первый поиск промахнулся,
          второй попытки не будет</strong>.
        </p>
      </Section>

      <Section title="Agentic RAG: LLM ведёт поиск в цикле">
        <p>
          В <Term id="agentic-rag">Agentic RAG</Term> модель работает по циклу ReAct (Reason → Act → Observe): сама решает, какой
          инструмент вызвать (векторный поиск, BM25, веб), хватает ли найденного, нужно ли переписать запрос. Цикл ограничивают
          числом итераций, иначе агент может бесконечно «уточнять». Подробнее про ReAct в графе —{' '}
          <Link to="/ch8/tools-reflection" className={linkCls}>
            глава 8
          </Link>
          .
        </p>
        <CodeBlock
          language="python"
          title="Agentic RAG на LangChain v1: поиск — это tool"
          code={`from langchain.agents import create_agent
from langchain.tools import tool

@tool
def search_docs(query: str) -> str:
    """Поиск по годовому отчёту. Если фрагменты не отвечают на вопрос,
    вызови ещё раз с другой формулировкой."""
    docs = retriever.invoke(query)[:6]
    return "\\n\\n".join(f"[{i}] {d.page_content}" for i, d in enumerate(docs))

agent = create_agent(
    model="openai:gpt-4.1-mini",
    tools=[search_docs, web_search],   # web_search — ещё один @tool
    system_prompt="Отвечай только по найденным фрагментам. Нет опоры — так и скажи.",
)
res = agent.invoke(
    {"messages": [{"role": "user", "content": "Как изменилась выручка в 2024?"}]},
    config={"recursion_limit": 12},    # потолок шагов цикла
)`}
        />
      </Section>

      <Section title="CRAG, Self-RAG, Adaptive RAG">
        <Tbl
          head={['Подход', 'Что решается', 'Механика']}
          rows={[
            [
              <Term key="crag" id="crag">CRAG</Term>,
              'Годится ли найденное',
              'Лёгкий оценщик retrieval ставит уверенность. Correct → уточнить знания (разбить, отфильтровать лишнее). Incorrect → отбросить и искать в вебе. Ambiguous → объединить оба источника.',
            ],
            ['Self-RAG', 'Искать ли, релевантно ли, подтверждено ли', 'Модель дообучена выдавать reflection-токены: нужен ли поиск, релевантен ли фрагмент, подтверждён ли ответ фрагментом, полезен ли ответ.'],
            ['Adaptive RAG', 'Сколько поиска нужно', 'Классификатор сложности вопроса выбирает маршрут: без поиска, один проход или многошаговый поиск.'],
          ]}
        />
        <Callout type="info">
          <p>
            В статьях CRAG и Self-RAG используют дообученные модели. В туториалах LangGraph те же идеи сделаны промптом-оценщиком
            (grader) и условным ребром. Это нормально, но на защите говори «в стиле CRAG», а не «реализовал CRAG».
          </p>
        </Callout>
      </Section>

      <Section title="Сравнение и честная терминология">
        <Tbl
          head={['', 'Advanced RAG', 'Corrective (порог в коде)', 'Agentic (ReAct)']}
          rows={[
            ['Кто решает о повторе', 'никто', 'код по score / оценщику', 'LLM'],
            ['Вызовов LLM', '1–2', '1–2 + повтор при провале', 'от 2, число заранее не известно'],
            ['Цена и латентность', 'минимум', 'предсказуемый потолок', 'выше и с разбросом'],
            ['Предсказуемость и отладка', 'высокая', 'высокая: путь виден по State', 'ниже: путь выбирает модель'],
            ['Когда брать', 'FAQ, низкая задержка', 'нужен второй шанс при промахе', 'многошаговые вопросы, синтез источников'],
          ]}
        />
        <CodeBlock
          language="typescript"
          title="apps/api/src/agent/triage.graph.ts (сокращено)"
          code={`const bind = (s: S) => {
  const top = s.hits[0]
  const forced = Boolean(s.humanComment)          // PM отверг цитату и написал, где искать
  if (top && (top.score >= BOUND_SCORE || forced)) // BOUND_SCORE = 0.45
    return { binding: { kind: 'clause', chunkId: top.chunkId, confidence: top.score } }
  return { binding: { kind: 'none' } }
}

const afterBind = (s: S) =>
  s.binding.kind === 'none' && s.rewriteCount < MAX_REWRITES && !s.humanComment // MAX_REWRITES = 2
    ? 'rewrite_query'
    : 'classify_evidence'`}
        />
        <Callout type="tip" title="Вопрос на защите">
          <p>
            <em>«Это agentic RAG?»</em> — Нет, это corrective RAG / query rewriting. Повторить ли поиск, решает порог в коде: лучший
            чанк ниже 0,45 и переписываний меньше двух — модель переписывает запрос, и поиск идёт снова. Модель влияет на путь
            только текстом запроса. Agentic RAG в системе есть снаружи: Claude Code через MCP сам решает, сколько раз звать{' '}
            <code>search_spec</code>.
          </p>
        </Callout>
        <Callout type="warn" title="Неточность в лекции">
          <ul>
            <li>
              <code>app_agentic_rag.py</code> подписан как LangGraph, но внутри обычный цикл <code>for</code> без StateGraph. LLM не
              выбирает инструменты, а только ставит accept или retry — это корректирующий цикл в стиле CRAG / Self-RAG, не ReAct.
            </li>
            <li>
              <code>retry_generation</code> при temperature 0 и том же контексте почти наверняка вернёт тот же ответ. В повтор надо
              подавать новый вход: другой контекст или текст ошибки.
            </li>
            <li>
              Retriever считает <code>alpha·vec + (1−alpha)·bm25_norm</code> — это взвешенная сумма, а не RRF из слайдов. Сумма
              зависит от шкал оценок, RRF работает только с рангами.
            </li>
          </ul>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Цикл 1 графа triage: <code>retrieve_docs → bind_to_clause → rewrite_query → retrieve_docs</code>.{' '}
          <code>BOUND_SCORE</code> лежит в <code>apps/api/src/llm/triage-llm.ts</code>, <code>MAX_REWRITES</code> — в{' '}
          <code>apps/api/src/agent/triage.graph.ts</code>. В своём <code>LECTURES.md</code> этот цикл назван agentic RAG — поправь
          на «corrective RAG / query rewriting по порогу», чтобы слова на защите совпадали с кодом.
        </p>
      </ProjectNote>

      <KeyIdea>
        Advanced RAG — один проход. Corrective RAG даёт второй шанс по правилу в коде. Agentic RAG отдаёт решения модели, и за
        гибкость платишь ценой, задержкой и предсказуемостью. Называй свой цикл так, как он работает на самом деле.
      </KeyIdea>
    </>
  )
}

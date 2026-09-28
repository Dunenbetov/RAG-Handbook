import { Link } from 'react-router-dom'
import { Callout, KeyIdea, No, ProjectNote, Section, Steps, Tbl, Warn, Yes } from '../../components/ui'
import { Term } from '../../components/Term'

export default function Lesson() {
  return (
    <>
      <Section title="Где кончаются цепочки">
        <p>
          Chain (например, LCEL <code>prompt | llm | parser</code>) — это конвейер: данные идут слева направо, каждый шаг
          ровно один раз. Для «retrieve → generate» этого хватает. Но как только появляется «проверь и переделай» или
          «спроси человека», конвейер ломается. Лекция называет четыре ограничения:
        </p>
        <Tbl
          head={['Нужно', 'Chain', <Term key="sg" id="stategraph">StateGraph</Term>]}
          rows={[
            ['Цикл: повторить поиск, переписать черновик', <><No />только внешний while</>, <><Yes />ребро назад + лимит в State</>],
            ['Ветвление по результату шага', <><Warn />RunnableBranch, быстро запутывается</>, <><Yes />conditional edge</>],
            ['Общее состояние между шагами', <><No />протаскивай руками</>, <><Yes />State с reducers</>],
            ['Пауза на человека, откат, рестарт', <><No />нет</>, <><Yes />checkpointer + interrupt</>],
          ]}
        />
      </Section>

      <Section title="Таксономия Anthropic: workflows и agents">
        <p>
          Самая полезная рамка для защиты — статья Anthropic «Building effective agents» (декабрь 2024). В ней оба вида
          систем называются agentic, но различаются тем, <strong>кто ведёт процесс</strong>. Workflow — это LLM и tools,
          связанные заранее прописанными путями в коде. Agent — система, где LLM сама направляет процесс и выбор
          инструментов: работает в цикле, пока не решит, что задача готова.
        </p>
        <Tbl
          head={['Паттерн workflow', 'Суть', 'Пример']}
          rows={[
            ['Prompt chaining', 'Шаги по очереди, между ними gate-проверки кодом', 'План → текст → перевод'],
            ['Routing', 'Классификатор выбирает ветку', 'Тип запроса → свой промпт или модель'],
            ['Parallelization', 'Sectioning (части параллельно) или voting (N прогонов)', 'Guardrail параллельно с ответом'],
            ['Orchestrator-workers', 'LLM делит задачу на подзадачи на лету', 'Правка кода в N файлах'],
            ['Evaluator-optimizer', 'Генератор пишет, критик оценивает, цикл', 'Черновик ↔ проверка опоры'],
          ]}
        />
        <p>Между «чистым кодом» и «чистым агентом» — спектр. Чем правее, тем больше гибкости и тем меньше предсказуемости, аудита и контроля цены:</p>
        <Steps
          items={[
            { title: 'Код решает всё', body: 'LLM — функция внутри шага: извлечь, классифицировать, написать. Маршрут — if в коде.' },
            { title: 'LLM выбирает ветку', body: 'Выход модели (класс, score, tool_call) читает route-функция. Набор путей всё ещё задан графом.' },
            { title: 'LLM в цикле с tools', body: 'ReAct: модель сама решает, какой tool звать и когда остановиться. Это agent в терминах Anthropic.' },
            { title: 'Несколько агентов', body: 'У каждого свой контекст, tools и handoff. Дорого, нужен только когда задача реально делится.' },
          ]}
        />
        <p>
          Совет из той же статьи: начинай с самого простого решения и добавляй автономию только тогда, когда простое
          измеримо не справляется. Агент платит латентностью и ценой за гибкость, а ошибки у него накапливаются.
        </p>
        <Callout type="tip" title="Вопрос на защите: где у тебя агент?">
          <p>
            «Граф triage — осознанно детерминированный workflow: routing, evaluator-optimizer (проверка опоры
            возвращает в bind) и HITL. LLM влияет на маршрут только своими выходами: score поиска, результат
            проверки. Человек влияет кнопкой. Агентная часть с tool-calling — Claude Code, который через мой MCP-сервер
            сам решает, когда звать <code>search_spec</code> или <code>apply_human_verdict</code>. Для приёмки мне важны
            одинаковый путь для каждой карточки, потолок в 9 вызовов модели и аудит — поэтому не ReAct».
          </p>
        </Callout>
      </Section>

      <Section title="Когда граф избыточен">
        <p>
          Правило лекции работает: <strong>если пайплайн рисуется прямой линией — хватит Chain или обычной функции</strong>.
          Простой <Term id="rag">RAG</Term>, один tool call без повторов, нет развилок и пауз — граф только добавит
          церемоний. Если на схеме есть стрелка назад, развилка или «ждём человека» — нужен StateGraph.
        </p>
        <Callout type="info" title="Граф ≠ агент">
          <p>
            LangGraph — рантайм для <em>обоих</em> видов систем. Детерминированный граф с условными рёбрами — это
            workflow. ReAct-цикл <code>agent ↔ tools</code> на том же LangGraph — agent. Сам факт использования LangGraph
            ничего не говорит об автономности.
          </p>
        </Callout>
      </Section>

      <Section title="LangGraph и альтернативы в 2026">
        <Tbl
          head={['Вариант', 'Модель', 'HITL и персистентность', 'Когда брать']}
          rows={[
            ['LangGraph (Python, JS)', 'Явный граф: State, узлы, рёбра', 'interrupt + checkpointer (Postgres, SQLite, свой)', 'Нужен контроль пути, паузы на дни, аудит'],
            ['LangChain v1 create_agent', 'Готовый цикл агента поверх LangGraph', 'HumanInTheLoopMiddleware', 'Нужен ReAct-агент быстро'],
            ['CrewAI (Python)', 'Crews — роли-агенты; Flows — событийный workflow', 'Flows: @router, @persist (SQLite), @human_feedback', 'Python-стек, ролевые команды'],
            ['AutoGen → Microsoft Agent Framework', 'Диалог агентов → graph-based workflows', 'MAF: checkpointing, request/response для HITL', 'Экосистема Microsoft (.NET и Python)'],
            ['Свой цикл', 'while + tool_calls', 'Всё руками', 'Один tool, прототип, ноль зависимостей'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Таблица «LangGraph против CrewAI и AutoGen» устарела: будто HITL и персистентность есть только у LangGraph.
            У AutoGen human input был с самого начала (<code>UserProxyAgent</code>), а преемником AutoGen и Semantic
            Kernel Microsoft назвала Agent Framework с чекпоинтами. У CrewAI Flows есть <code>@router</code>,{' '}
            <code>@persist</code> и <code>@human_feedback</code>. Честное отличие LangGraph — низкоуровневый явный граф и
            зрелый interrupt/checkpointer, а не монополия на HITL.
          </p>
        </Callout>
        <Callout type="tip" title="Вопрос на защите: почему LangGraph, а не CrewAI?">
          <p>
            «Бэкенд на NestJS, а CrewAI — только Python, пришлось бы поднимать отдельный сервис. LangGraph.js живёт в том
            же процессе, а interrupt и чекпоинты лежат в той же Postgres, что и данные. Признаю: CrewAI Flows умеет router,
            persist и human feedback, прототипов на нём я не делал — выбор по стеку, а не по замеру».
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          <code>apps/api/src/agent/triage.graph.ts</code> — 12 нод и 4 условных ребра, и каждый паттерн там можно
          назвать по Anthropic. <strong>Routing</strong>: <code>afterRetrieve</code> ведёт в vision, только если есть кадр.
          Corrective-цикл: <code>rewrite_query</code> срабатывает при score ниже 0,45, не больше 2 раз.
          <strong> Evaluator-optimizer</strong>: <code>faithfulness_gate</code> → <code>bind_to_clause</code>.
          <strong> HITL</strong>: <code>hitl</code> с <code>interrupt()</code>. Обоснование выбора — в{' '}
          <code>docs/adr/014-orchestration-langgraph.md</code>. Остальные трудные вопросы разобраны в{' '}
          <Link to="/ch11/hard-questions" className="text-accent hover:underline">«Вопросах-ловушках»</Link>.
        </p>
      </ProjectNote>

      <KeyIdea>
        Workflow — путь задан кодом, agent — LLM сама ведёт цикл и выбирает tools. LangGraph строит и то и другое. Граф
        remark-round — детерминированный workflow (routing + evaluator-optimizer + HITL), и это осознанный выбор ради
        предсказуемости, цены и аудита. Агентная часть — Claude Code через MCP.
      </KeyIdea>
    </>
  )
}

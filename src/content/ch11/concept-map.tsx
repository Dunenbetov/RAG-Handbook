/* eslint-disable react/jsx-key -- статичные строки Tbl: порядок не меняется, key не нужен */
import { Link } from 'react-router-dom'
import { Callout, KeyIdea, ProjectNote, Section, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

const L = 'text-accent hover:underline'

export default function Lesson() {
  return (
    <>
      <Section title="Карта: модуль → файл → фраза → оговорка">
        <p>
          На каждый модуль курса у тебя должны быть путь в репозитории, одна фраза и честная оговорка. Оговорку говори сам, до
          вопроса: ментор, который нашёл слабое место первым, снимает больше баллов. Пути — от корня{' '}
          <code>remark-round</code>, <code>api/</code> означает <code>apps/api/src/</code>.
        </p>
        <Tbl
          head={['Модуль', 'Где в коде', 'Что сказать', 'Честная оговорка']}
          rows={[
            [<Link to="/ch8/stategraph" className={L}>Оркестрация</Link>, <><code>api/agent/triage.graph.ts</code>, <code>retest.graph.ts</code>, <code>graph-state.ts</code>, <code>prisma-checkpointer.ts</code></>, 'Детерминированный workflow: 12 нод, два цикла с лимитом, interrupt и чекпоинт в Postgres', 'агента с tool-calling внутри нет; CrewAI и Parlant не прототипировали'],
            [<Link to="/ch5/why-mcp" className={L}>MCP</Link>, <><code>apps/mcp/src/server.ts</code>, <code>main.ts</code></>, '4 tool + prompt uat-triage для ИИ-ассистента в IDE, stdio и Streamable HTTP', 'граф MCP не использует; на Railway не поднят; тонкий фасад над REST'],
            [<Link to="/ch5/skills-ace" className={L}>Skill</Link>, <><code>skills/uat-triage/SKILL.md</code>, <code>api/llm/skill.ts</code></>, 'Одна процедура у трёх потребителей: граф, MCP-prompt, Claude Code', 'в продукте это текст в системном промпте, механики триггеров нет'],
            [<Link to="/ch1/chunking" className={L}>RAG</Link>, <><code>api/rag/chunker.ts</code>, <code>rag.service.ts</code>, <code>api/llm/embeddings.service.ts</code></>, 'Чанк = раздел ТЗ (длиннее 220 слов — окна с перекрытием 40), 3-small, pgvector HNSW, фильтр проекта в SQL', 'корпус golden — 11 чанков; reranker нет; поиск только векторный'],
            ['Парсинг', <><code>api/rag/extract.ts</code>, <code>api/imports/journal-parser.ts</code></>, 'PDF, DOCX, DOC, MD и журнал XLSX, картинки из ячеек становятся кадрами', 'OCR сканов нет; в старом .doc теряется автонумерация заголовков'],
            [<Link to="/ch6/image-models" className={L}>Мультимодальность</Link>, <><code>api/llm/openai-triage-llm.ts</code>, <code>api/diff/diff.service.ts</code></>, 'Модель снимает факты с кадра; на ретесте алгоритм считает дифф, модель поясняет', 'pixelmatch — алгоритм, а не LLM; абляция vision нечистая'],
            [<Link to="/ch9/traces" className={L}>Трейсинг</Link>, <><code>api/observability/observability.service.ts</code>, <code>api/llm/pricing.ts</code></>, 'Один прогон = один trace, session = замечание, generation на каждый вызов', 'наш прайс без кэша: Langfuse насчитал на 17% меньше'],
            [<Link to="/ch9/evals" className={L}>Evals</Link>, <><code>evals/golden.json</code>, <code>api/evals/metrics.ts</code>, <code>docs/EVALS.md</code></>, '49 кейсов, binding + структурная проверка опоры + hit@k, офлайн в CI', 'синтетика, кейсы писал автор промпта, отложенной выборки нет'],
            ['Гиперпараметры', <><code>api/llm/llm-params.ts</code>, ADR 015</>, 'mini на ярлыках и JSON, gpt-4.1 только на тексте для человека; T 0 / 0,3; top_p не передаём', 'все отличия в пределах шума; T черновика выбрана заранее'],
            ['Guardrails', <><code>api/agent/guardrails.ts</code>, <code>faithfulness.ts</code>, <code>tenancy.leakage.spec.ts</code></>, 'Инъекции помечаются, а не блокируются; критичное держит код: фильтр проекта, закрывает только человек', '15 регулярок, только текст; PII и токсичность не фильтруются'],
            ['Fallback', <><code>api/llm/openai-client.ts</code>, <code>api/jobs/jobs.service.ts</code>, <code>api/config.ts</code></>, '2 повтора SDK, повторы очереди через 30 с / 2 мин / 8 мин, LLM_MODE=rules, $20 в сутки', 'второго поставщика нет; эмбеддинги тоже OpenAI'],
          ]}
        />
      </Section>

      <Section title="MCP: интерфейс для внешних агентов, а не для графа">
        <p>
          Свой сервер на официальном TypeScript SDK: <code>search_spec</code>, <code>get_round_remarks</code>,{' '}
          <code>apply_human_verdict</code>, <code>submit_retest_evidence</code> и <Term id="mcp-prompt">prompt</Term>{' '}
          <code>uat-triage</code>. Два транспорта: <Term id="stdio-transport">stdio</Term> (IDE запускает процесс сама, tool может
          прочитать локальный кадр) и <Term id="streamable-http">Streamable HTTP</Term> без сессий. Проект берётся из токена,
          tool'а закрытия нет, и тест проверяет, что его нет.
        </p>
        <CodeBlock
          language="typescript"
          title="apps/mcp/src/server.ts — читающий tool (сокращено)"
          code={`server.registerTool('search_spec', {
  title: 'Поиск по пакету документов проекта',
  description: '… Если выше порога ничего нет, ответ — «Опоры нет»: это тоже ответ, раздел не выдумывай.',
  inputSchema: {
    query: z.string().min(1).max(500),
    k: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ query, k }) => {
  const { hits, boundScore } = await api.search(projectId, query, k); // тот же REST
  return formatSearch(hits, boundScoreOf(boundScore)); // ниже 0.45 — «Опоры нет»
});`}
        />
        <Callout type="tip" title="Вопрос на защите: «почему MCP, а не обычный API?»">
          <p>
            «REST остаётся главным — им пользуется Angular. REST рассчитан на код, который программист написал заранее, а MCP —
            на ИИ-ассистента, который сам получает список tool'ов, схемы и правила домена при подключении. Один JSON-конфиг — и
            Claude Code или Cursor работают с проектом. Честно: это тонкий фасад тех же REST-маршрутов, граф им не пользуется —
            ходить к самому себе по сети значило бы добавить задержку и точку отказа.» Где MCP, A2A и LangGraph стоят относительно
            друг друга — в уроке <Link to="/ch10/multi-agent-a2a" className={L}>Мультиагенты и A2A</Link>.
          </p>
        </Callout>
      </Section>

      <Section title="Skill: где progressive disclosure работает, а где нет">
        <p>
          У <Term id="skills">Skill</Term> три уровня: метаданные (<code>name</code>, <code>description</code>) всегда в контексте
          агента, тело подгружается по совпадению с <code>description</code>, файлы из <code>references/</code> — по ссылке из
          тела. У <code>uat-triage</code> три потребителя, и уровни работают по-разному.
        </p>
        <VS
          left={{ title: 'Claude Code (плагин)', tone: 'good', children: <p>Настоящий Skill: на фразу «баг или хотелка?» агент сам подгрузил тело (проверено 20.09). Триггеры — в <code>description</code>: «Используй, когда… Не используй…».</p> }}
          right={{ title: 'Граф в продукте', tone: 'neutral', children: <p>Тело без YAML-шапки вставляется в системный промпт всех вызовов, кроме rewrite. Триггеров нет — это общая процедура для модели. Абляция: binding тот же, но 6 ответов сменили класс.</p> }}
        />
        <Callout type="warn" title="Дыра, которую стоит назвать самому">
          <p>
            Файлы <code>references/classes.md</code>, <code>examples.md</code>, <code>tools.md</code> лежат рядом, но в теле
            SKILL.md не упомянуты — агент не знает, что их можно открыть, и третий уровень disclosure не срабатывает. Исправление —
            строка в теле: «определения классов — references/classes.md, примеры — references/examples.md». Но тело идёт в
            системный промпт продукта, поэтому правка меняет хеш промпта и цифры M1: делать её вместе с новым замером.
          </p>
        </Callout>
      </Section>

      <Section title="RAG и мультимодальность: короткие ответы">
        <ul>
          <li><strong>Почему pgvector:</strong> одна Postgres уже хранит очередь, чекпоинты и замечания; векторы там же — один бэкап и фильтр проекта в том же SQL. Подробнее — <Link to="/ch1/vector-db" className={L}>векторные БД</Link>.</li>
          <li><strong>Почему <Term id="hnsw">HNSW</Term>, а не IVFFlat:</strong> не требует обучения на заполненной таблице. Включён <code>hnsw.iterative_scan = relaxed_order</code> (pgvector ≥ 0.8): фильтр проекта применяется после обхода индекса, и без дочитывания маленький проект мог бы получить меньше k строк.</li>
          <li><strong>Почему без <Term id="reranking">reranker</Term>:</strong> classify получает до 8 фрагментов целиком и сам указывает опоры, код отбрасывает id не из выдачи. На сотнях страниц ТЗ решение пересматривается.</li>
          <li><strong>Что даёт картинка:</strong> ретест с моделью узнаёт 3 из 3 настоящих исправлений, без модели 0 из 3; кейс «текст врёт, скрин спасает» верен в 15 прогонах из 16. Но второй такой кейс картинка не спасает: факты кадра верные, а classify всё равно ставит дефект.</li>
          <li><strong>Цикл rewrite — corrective RAG, а не agentic:</strong> повторный поиск запускает порог близости в коде, модель только переписывает запрос. Разница разобрана в уроке <Link to="/ch10/agentic-rag" className={L}>Advanced vs Agentic RAG</Link>, а strict JSON у classify — в <Link to="/ch10/structured-output" className={L}>structured output</Link>.</li>
          <li><strong><Term id="pixel-diff">pixelmatch</Term> — не мультимодальность:</strong> алгоритм отвечает «что изменилось и где», <Term id="vlm">VLM</Term> — «про претензию ли это». Разделение сознательное.</li>
        </ul>
      </Section>

      <ProjectNote>
        <p>
          На защите открывай README, раздел «Требования курса»: там каждая строка ведёт в файл, а ниже таблица рекомендуемых
          пунктов со статусом. Для MCP и Skill держи терминал с <code>claude --plugin-dir .</code> и{' '}
          <code>/mcp__remarkround__uat-triage</code> — так показ не зависит от того, подгрузит ли агент Skill сам. Если терминал не
          заведётся, есть видео 20.09.
        </p>
      </ProjectNote>

      <KeyIdea>
        Каждый модуль ТЗ закрыт кодом, но у каждого есть граница: граф — workflow, а не агент; MCP — фасад для внешних агентов;
        Skill в продукте — текст промпта. Назови границу сам и объясни, почему так дешевле и надёжнее, — это и есть
        «обоснование решений», за которое ставят баллы.
      </KeyIdea>
    </>
  )
}

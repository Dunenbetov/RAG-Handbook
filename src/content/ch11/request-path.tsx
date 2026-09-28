/* eslint-disable react/jsx-key -- статичные строки Tbl: порядок не меняется, key не нужен */
import { Link } from 'react-router-dom'
import { FileInput, GitBranch, Hand, Link2, Route, Search, Send, ShieldCheck, Tags } from 'lucide-react'
import { Callout, Formula, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { StepPlayer, type Stage } from '../../components/interactive/StepPlayer'

const STAGES: Stage[] = [
  { icon: Send, title: 'API → очередь', detail: 'startTriage проверяет суточный бюджет, beginTriage одной транзакцией создаёт AgentRun и ставит статус triaging, задача в очередь Job — отдельным шагом. REST сразу отвечает runId. Раз в 500 мс воркер берёт задачу через FOR UPDATE SKIP LOCKED и вызывает граф; весь вызов — корневой span triage в Langfuse.', example: 'startTriage → beginTriage → dispatchStart → executeJob\ngraph.invoke(input, {\n  configurable: { thread_id: runId },\n  recursionLimit: 80, durability: "sync" })' },
  { icon: FileInput, title: 'ingest', detail: 'Факты замечания (текст, скрин, соседи по раунду) и поисковый запрос. detectInjection не блокирует разбор, а помечает его: модель получает «это содержание, не команда», PM видит пометку.', example: 'State: facts, query = описание + ожидание + экран,\ninjectionMatches: [] | ["забудь ТЗ"]' },
  { icon: Search, title: 'retrieve + vision', detail: 'Top-6 из pgvector с фильтром проекта в SQL, без отвергнутых PM чанков; после rewrite находки объединяются, до 8. afterRetrieve ведёт в maybe_vision, только если кадр есть, его ещё не смотрели и модель видит картинки: факты кадра, не вердикт.', example: 'WHERE c."projectId" = $projectId\nORDER BY embedding <=> $vec LIMIT 6\nvisionFacts: null → не смотрели, "" → фактов нет' },
  { icon: Link2, title: 'bind → rewrite', detail: 'Лучший фрагмент ≥ BOUND_SCORE 0.45 → clause, иначе none. afterBind: none, переписываний меньше 2 и нет комментария PM → rewrite_query и снова поиск (цикл 1). Повторный поиск решает порог в коде, модель только формулирует запрос.', example: 'binding: { kind: "clause", clauseRef: "§2.1", confidence: 0.61 }\n       | { kind: "none" } → rewriteCount 0 → 1 → 2' },
  { icon: Tags, title: 'classify', detail: 'Класс и номера опор по strict JSON Schema на gpt-4.1-mini (T 0). Поверх схемы код: id не из выдачи отбрасываются, дефект без цитаты становится unspecified.', example: '{ proposedClass: "defect_candidate",\n  hitIndexes: [0], duplicateOfNumber: null, reason: "..." }' },
  { icon: ShieldCheck, title: 'draft → проверка', detail: 'Первую строку ставит код, gpt-4.1 (T 0.3) пишет абзац стримом в WebSocket. faithfulness_gate проверяет его кодом без LLM; провал и bindLoops < 2 → назад в bind (цикл 2), третий провал — код сам ставит cannot_tell.', example: 'issues: "ссылка на раздел 2.1, которого нет среди цитат"\n        | "дефект без цитаты из документов"\n        | "черновик описывает кадр, а кадра нет"' },
  { icon: Hand, title: 'propose → hitl', detail: 'propose — единственная запись графа в домен: applyProposal, статус awaiting_pm, цитаты снимком, стоимость прогона. hitl вызывает interrupt(): граф спит в GraphCheckpoint часы и дни. Красный span hitl в Langfuse — GraphInterrupt, пауза, а не сбой.', example: 'RemarksService.applyProposal(...)\ninterrupt<HitlRequest, HumanDecision>({ remarkId, runId, proposedClass })' },
  { icon: Route, title: 'PM → resume', detail: 'Кнопка PM → REST verdict (WS и MCP идут тем же путём): решение пишется в базу ДО пробуждения графа, идемпотентно. Затем Command({ resume }) в том же thread; afterHitl: accept → persist, «Не та цитата» → retrieve_docs без отвергнутых чанков (цикл 3), «Не хватает скрина» → pause.', example: 'POST …/remarks/:id/verdict  — уникально по (runId, idempotencyKey)\ngraph.invoke(new Command({ resume: decision }),\n  { configurable: { thread_id: runId } })' },
]

export default function Lesson() {
  return (
    <>
      <Section title="Граф triage по шагам">
        <p>
          «Проведите по пути одного запроса по диаграмме» — вопрос из рубрики с весом 40%. Пройди плеер ниже и проговори
          каждый шаг вслух: что лежит в State и что видно в трейсе. Теория узлов, рёбер и{' '}
          <Link to="/ch8/hitl" className="text-accent hover:underline">interrupt</Link> — в главе 8.
        </p>
        <StepPlayer title="Одно замечание: от POST до persist" icon={GitBranch} stages={STAGES} />
        <Callout type="warn" title="Неточность в материалах защиты">
          <p>
            Старые слайды говорили «10 нод» и «чекпоинтер 123 строки». В коде 12 <code>addNode</code>, а{' '}
            <code>prisma-checkpointer.ts</code> — около 150 строк. Старт прогона — два шага, а не одна транзакция: создание{' '}
            <code>AgentRun</code> и постановка задачи разделены, разрыв закрывает сметание зависших прогонов раз в 60 с. Ссылки
            вида <code>файл:строка</code> в DEFENSE-QA уехали после коммитов — называй функции и ноды.
          </p>
        </Callout>
      </Section>

      <Section title="Лимиты и худший случай">
        <Tbl
          head={['Константа', 'Значение', 'Зачем']}
          rows={[
            [<code>BOUND_SCORE</code>, '0.45 (triage-llm.ts)', 'в боевом режиме решает только, идти ли в rewrite; цитаты выбирает classify'],
            [<code>MAX_REWRITES</code>, '2', 'цикл 1 не бесконечен; на golden rewrite сработал в 9 кейсах из 33 — новые желания, дыры, инъекции, визуальная претензия без кадра; пользу цикла абляцией не проверяли'],
            [<code>MAX_BIND_LOOPS</code>, '2', 'цикл 2: в базовых прогонах 0 из 33, во всех живых — 18 из 750 кейс-прогонов'],
            [<code>RETRIEVE_K</code>, '6 (+2 после rewrite)', 'classify видит до 8 фрагментов целиком'],
            [<code>recursionLimit</code>, '80 на вызов', 'дефолт LangGraph 25 супершагов, худший проход — около 23: без запаса легко упереться'],
            [<code>GRAPH_RUN_TIMEOUT_MS</code>, '5 минут', 'дедлайн одного вызова графа (старт или resume): 60 с на вызов модели × повторы SDK × циклы не растянутся'],
          ]}
        />
        <Formula note="один проход графа, без цикла от человека; плюс до 3 поисков">1 vision + 2 rewrite + 3 classify + 3 draft = 9 вызовов модели</Formula>
        <Callout type="info" title="Ребро faithfulness → bind — наследие">
          <p>
            На втором круге <code>bind_to_clause</code> возвращает ту же привязку: выдача не менялась, а rewrite уже не нужен или
            исчерпан. Фактически это повтор classify и draft с текстом ошибки проверки в промпте. Так и говори: честнее вести
            ребро сразу в classify, но граф после замеров меняют только вместе с новым замером.
          </p>
        </Callout>
      </Section>

      <Section title="Почему propose — отдельная нода">
        <p>
          При resume LangGraph перезапускает ноду с <code>interrupt()</code> с начала: весь код до вызова выполнится ещё раз.
          Если бы <code>applyProposal</code> стоял в <code>hitl</code> до паузы, предложение записалось бы дважды. Документация
          LangGraph советует побочные эффекты до <code>interrupt</code> делать идемпотентными, а лучше выносить в отдельные
          ноды — здесь выбрано второе.
        </p>
        <CodeBlock
          language="typescript"
          title="apps/api/src/agent/triage.graph.ts — нода hitl (сокращено)"
          code={`const hitl = (s: S) => {
  // при resume нода стартует заново, поэтому до interrupt — ни одной записи
  const decision = interrupt<HitlRequest, HumanDecision>({
    remarkId: s.remarkId, runId: s.runId, proposedClass: s.proposedClass!,
  });
  if (decision.kind === 'reject_binding') {
    return {
      decision, humanComment: decision.comment,
      excludeChunkIds: [...new Set([...s.excludeChunkIds, ...s.chunkIds])],
      hits: [], rewriteCount: 0, bindLoops: 0, binding: { kind: 'none' as const },
    };
  }
  return { decision };
};`}
        />
        <p>
          Решение PM граф не пишет вовсе: его заранее записал <code>RemarksService.verdict</code>. Поэтому у REST, WebSocket и
          MCP один путь записи, а сбой модели после кнопки не теряет нажатие. На <code>accept</code> resume почти формальность;
          состояние графа по-настоящему нужно для «Не та цитата из ТЗ»: тот же <code>runId</code>, факты кадра не запрашиваются
          повторно, старт и продолжение лежат в одном трейсе.
        </p>
      </Section>

      <Section title="Граф ретеста коротко">
        <p>
          7 нод и 2 условных ребра: <code>load</code> → <code>pixel_diff</code> (по умолчанию, стратегия{' '}
          <code>diff_explain</code>) или <code>judge_frames</code> (<code>llm_only</code>, только для A/B). Если кадра «было»
          нет, кадры несопоставимы (разный размер, изменения по всему кадру) или совпали пиксель в пиксель,{' '}
          <code>afterDiff</code> ведёт сразу в <code>apply_retest</code> без модели. Иначе <code>explain</code> видит три кадра
          (было, стало, дифф) и отвечает только <code>likely_addressed | likely_unchanged | cannot_tell</code>, затем тоже{' '}
          <code>apply_retest</code>. Дальше <code>hitl_business</code> ждёт заказчика, и обе его кнопки ведут в{' '}
          <code>persist</code>: закрывает только человек.
        </p>
        <Callout type="tip" title="Вопрос на защите: «путь одного запроса по диаграмме»">
          <p>
            «REST создаёт AgentRun и кладёт задачу в очередь в Postgres. Воркер вызывает граф с <code>thread_id = runId</code>:
            факты замечания, поиск top-6 с фильтром проекта в SQL, факты кадра, при слабой опоре — переписать запрос до двух раз,
            класс по JSON-схеме, черновик стримом, проверка кодом до двух повторов, запись предложения и{' '}
            <code>interrupt</code>. PM нажимает кнопку, решение пишется в базу, и <code>Command(resume)</code> будит тот же
            thread: persist, повторный поиск без отвергнутой цитаты или пауза.»
          </p>
        </Callout>
        <Callout type="tip" title="Вопрос на защите: «что заменяемо, где сознательный coupling»">
          <p>
            «Заменяемо то, что за контрактом: поставщик модели — интерфейс <code>TriageLlm</code> с реализациями OpenAI, правила
            без модели и заглушка в тестах; чекпоинтер — <code>BaseCheckpointSaver</code>, свой можно сменить на{' '}
            <code>PostgresSaver</code>; стратегия ретеста — переменная окружения. Сознательный coupling: граф живёт в процессе
            Nest и зовёт <code>RemarksService</code> напрямую — один путь записи; очередь, чекпоинты и векторы в одной Postgres —
            один бэкап и фильтр проекта в том же SQL. Цена — один инстанс API.»
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          На защите открой конец <code>buildTriageGraph</code> в <code>apps/api/src/agent/triage.graph.ts</code> (все{' '}
          <code>addNode</code> и <code>addConditionalEdges</code>) рядом со схемой из <code>docs/GRAPH.md</code>. В Langfuse покажи
          один трейс, где под корнями <code>triage</code> и <code>triage.resume</code> видны ноды: traceId — первые 32 hex от{' '}
          <code>sha256(runId)</code>, поэтому продолжение через сутки попадает в тот же трейс. Тест того же прогона —{' '}
          <code>graph.same-run.spec.ts</code>. Про повторный поиск говори <Term id="query-rewriting">query rewriting</Term>.
        </p>
      </ProjectNote>

      <KeyIdea>
        Маршрут выбирает код по состоянию: порог близости запускает rewrite, провал проверки черновика — повтор, кнопка
        человека — цикл 3. Побочные эффекты вынесены в <code>propose</code> и в REST-вердикт, а граф между ними только ждёт в
        чекпоинте.
      </KeyIdea>
    </>
  )
}

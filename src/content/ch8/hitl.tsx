import { Database, Flag, Hand, Hourglass, Play, RotateCcw, Save } from 'lucide-react'
import { Callout, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { StepPlayer, type Stage } from '../../components/interactive/StepPlayer'

const STAGES: Stage[] = [
  { icon: Play, title: 'invoke', detail: 'Первый вызов с thread_id. После каждого супершага checkpointer пишет снимок State в разрезе этого thread.', example: 'graph.invoke(input, {configurable: {thread_id: "run-42"}})\ncheckpoints[run-42]: ingest, retrieve_docs, ...' },
  { icon: Save, title: 'propose', detail: 'Побочный эффект (запись предложения в БД) вынесен в отдельную ноду ДО hitl. Её результат уже в чекпоинте, повторно она не выполнится.', example: 'propose: applyProposal(runId, proposedClass)\ncheckpoint: next = ["hitl"]' },
  { icon: Hand, title: 'interrupt', detail: 'Нода hitl вызывает interrupt(payload). Граф останавливается, чекпоинт хранит pending interrupt, invoke возвращает payload.', example: 'result.__interrupt__ = [{ value: {\n  remarkId: "r-7", proposedClass: "defect_candidate" } }]' },
  { icon: Hourglass, title: 'пауза', detail: 'Ничего не исполняется: граф — это строки в базе. Процесс можно перезапустить, PM может думать хоть неделю.', example: 'getState(config).next -> ["hitl"]\ngetState(config).tasks[0].interrupts -> [ ... ]' },
  { icon: Database, title: 'resume', detail: 'Решение человека приходит тем же thread_id. Значение из Command станет результатом interrupt().', example: 'graph.invoke(new Command({ resume: { kind: "accept" } }),\n             {configurable: {thread_id: "run-42"}})' },
  { icon: RotateCcw, title: 'нода заново', detail: 'Ловушка: hitl выполняется С НАЧАЛА. Весь код до interrupt() отработает второй раз, только теперь interrupt() сразу вернёт resume-значение.', example: 'hitl(state):\n  log("hitl start")        # второй раз!\n  decision = interrupt(..)  # -> {kind: "accept"}\n  return {decision}' },
  { icon: Flag, title: 'END', detail: 'afterHitl читает decision и ведёт в persist → END. Вся история чекпоинтов run-42 доступна для отладки.', example: 'afterHitl: "accept" -> persist -> END\ngetStateHistory(config) -> все снимки run-42' },
]

export default function Lesson() {
  return (
    <>
      <Section title="Зачем пауза и что такое checkpointer">
        <p>
          <Term id="hitl">Human-in-the-loop</Term> нужен там, где ошибку нельзя откатить: деньги, письма, удаление данных,
          «рассылка 50 000 писем». Паттерны — approve, reject с комментарием, edit (человек правит черновик). Чтобы граф
          мог уснуть и проснуться через день, его State надо где-то хранить. Это делает{' '}
          <Term id="checkpointer">checkpointer</Term>: снимок State после каждого супершага в разрезе{' '}
          <code>thread_id</code> (<code>{'config={"configurable": {"thread_id": ...}}'}</code>). Без checkpointer не
          работают ни interrupt, ни память между вызовами, ни time travel.
        </p>
        <Tbl
          head={['Реализация', 'Где хранит', 'Когда']}
          rows={[
            [<code key="m">InMemorySaver</code>, 'Память процесса', 'Тесты, ноутбук; рестарт — всё потеряно'],
            [<code key="s">SqliteSaver</code>, 'Файл SQLite (пакет langgraph-checkpoint-sqlite)', 'Локальная разработка, один процесс'],
            [<code key="p">PostgresSaver</code>, 'Postgres, таблицы создаёт setup()', 'Прод, несколько процессов'],
            ['Свой BaseCheckpointSaver', 'Где угодно: getTuple / put / putWrites / list', 'Нужна своя схема или контроль записи'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            <code>memory = SqliteSaver.from_conn_string(":memory:")</code> не работает как присваивание: в актуальных
            версиях это контекстный менеджер —{' '}
            <code>with SqliteSaver.from_conn_string("checkpoints.db") as memory:</code> (или{' '}
            <code>SqliteSaver(sqlite3.connect(...))</code>), пакет <code>langgraph-checkpoint-sqlite</code> ставится отдельно.
            А <code>:memory:</code> убивает сам смысл — персистентность. Ещё одна ошибка скрипта лекции:{' '}
            <code>thread_id += 1</code> на каждое сообщение. thread — это один диалог или один прогон; новый id на
            каждую реплику означает «нет памяти», checkpointer работает только ради HITL.
          </p>
        </Callout>
      </Section>

      <Section title="interrupt() и Command(resume)">
        <p>
          Способов остановить граф два. <strong>Динамический</strong> <code>interrupt(payload)</code> внутри ноды:
          payload уходит наружу, продолжение — <code>invoke(Command(resume=value), config)</code>. <strong>Статические
          брейкпоинты</strong> <code>interrupt_before</code> / <code>interrupt_after</code>: граф встаёт перед нодой,
          продолжение — <code>invoke(None, config)</code>. Документация LangGraph прямо говорит, что статические
          прерывания не рекомендуются для HITL — это инструмент отладки.
        </p>
        <CodeBlock
          language="python"
          title="Approve / edit / reject через interrupt"
          code={`from langgraph.types import interrupt, Command

def human_review(state):
    decision = interrupt({"question": "Отправить письмо?", "draft": state["draft"]})
    if decision["action"] == "approve":
        return {"status": "approved"}
    if decision["action"] == "edit":
        return {"draft": decision["text"], "status": "approved"}
    return {"status": "rejected", "feedback": decision.get("comment", "")}

config = {"configurable": {"thread_id": "email-42"}}
result = app.invoke({"request": "..."}, config)
while "__interrupt__" in result:                   # while, а не if
    payload = result["__interrupt__"][0].value
    result = app.invoke(Command(resume=ask_human(payload)), config)`}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Конспект показывает HITL только через <code>interrupt_before</code> + <code>invoke(None)</code>, а код
            лекции — уже через <code>interrupt()</code>. Правильный путь — второй. И в <code>main()</code> interrupt
            обрабатывается через <code>if</code>: после фидбэка граф снова доходит до review и засыпает, но второй
            interrupt никто не ловит — ответ печатается, а граф висит на паузе. Нужен цикл <code>while</code>.
          </p>
        </Callout>
      </Section>

      <Section title="Главная ловушка: нода перезапускается с начала">
        <StepPlayer title="Таймлайн HITL: от invoke до END" icon={Hand} stages={STAGES} />
        <Callout type="danger" title="Побочные эффекты до interrupt выполнятся дважды">
          <p>
            При resume нода с <code>interrupt()</code> исполняется заново с первой строки. Всё, что стоит до interrupt —
            запись в БД, отправка письма, вызов LLM, — повторится. Правило: такой код либо идемпотентный, либо
            вынесен в <strong>отдельную ноду перед</strong> HITL-нодой. Если в одной ноде несколько interrupt, resume-значения
            сопоставляются им <strong>по порядку</strong>: не вызывай interrupt условно и не меняй их порядок.
          </p>
        </Callout>
        <CodeBlock
          language="typescript"
          title="remark-round: interrupt и resume на LangGraph.js"
          code={`import { Command, interrupt } from '@langchain/langgraph'

// нода hitl: до interrupt — ничего с побочными эффектами (запись сделала нода propose)
const hitl = (s: S) => {
  const decision = interrupt<HitlRequest, HumanDecision>({ remarkId: s.remarkId, runId: s.runId, proposedClass: s.proposedClass! })
  return { decision }
}

// по кнопке PM — через минуты или дни, возможно после рестарта процесса
const config = { configurable: { thread_id: runId } }
const snap = await graph.getState(config)
if (snap.next.length) await graph.invoke(new Command({ resume: decision }), { ...config, durability: 'sync' })`}
        />
      </Section>

      <Section title="Time travel и durability">
        <ul>
          <li><code>get_state(config)</code> — текущий снимок: <code>values</code>, <code>next</code>, <code>tasks</code> с висящими interrupts.</li>
          <li><code>get_state_history(config)</code> — все чекпоинты thread от нового к старому: воспроизвести баг, найти шаг, где State испортился.</li>
          <li><code>update_state(config, values, as_node=...)</code> — создаёт <strong>новый</strong> чекпоинт (старый не меняется), значения проходят через reducers. Затем <code>invoke(None, fork_config)</code> продолжает с развилки.</li>
        </ul>
        <p>
          <strong>durability</strong> задаёт, когда чекпоинт пишется: <code>"exit"</code> — только при выходе из графа
          (быстро, но промежуточное состояние теряется при крэше), <code>"async"</code> (по умолчанию) — в фоне, пока идёт следующий шаг,{' '}
          <code>"sync"</code> — до начала следующего шага (надёжнее всего, чуть медленнее).
        </p>
        <Callout type="tip" title="Вопрос на защите: переживёт ли граф рестарт? Что если API упадёт во время interrupt?">
          <p>
            «Да. Чекпоинты пишет мой <code>PrismaCheckpointSaver</code> в таблицу <code>GraphCheckpoint</code> той же
            Postgres, с <code>durability: 'sync'</code>. Во время interrupt граф не исполняется — это строки в базе, процесс
            можно перезапускать. Кнопка PM → решение пишется в БД → <code>getState</code> видит паузу →{' '}
            <code>Command({'{ resume }'})</code> продолжает с последнего чекпоинта. Честно: отдельным тестом рестарт во время
            паузы не проверен, это следует из устройства. Сбой посреди прогона — другой случай: очередь повторит задачу,
            и прогон стартует заново с чистого thread. Красный span <code>hitl</code> в Langfuse —
            это GraphInterrupt, то есть пауза, а не сбой».
          </p>
        </Callout>
        <Callout type="tip" title="Вопрос на защите: почему thread_id = runId, а не remarkId?">
          <p>
            «thread — одна история чекпоинтов. У замечания бывает несколько прогонов; с <code>remarkId</code> новый прогон
            унаследовал бы старый State и висящий interrupt. С <code>runId</code> отмена удаляет ровно один thread, а «Не та
            цитата» продолжает тот же run из его чекпоинта. Группировку по замечанию даёт Langfuse: <code>sessionId =
            remarkId</code>, а trace id выводится из runId, поэтому <code>triage</code> и <code>triage.resume</code> лежат
            в одном трейсе».
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          <code>apps/api/src/agent/prisma-checkpointer.ts</code> — свой <code>BaseCheckpointSaver</code> на ~150 строк
          (<code>getTuple / list / put / putWrites / deleteThread</code>), порт MemorySaver поверх Prisma. Плюсы своего по сравнению
          с готовым PostgresSaver: таблица живёт в Prisma-миграциях рядом с данными, а отмена дожидается записей «в полёте»,
          чтобы после <code>deleteThread</code> не осталось сирот. В <code>agent.service.ts</code>:{' '}
          <code>thread_id: runId</code>, <code>durability: 'sync'</code>, <code>recursionLimit: 80</code>, перед resume —{' '}
          <code>getState</code>. В <code>triage.graph.ts</code> запись предложения вынесена в ноду <code>propose</code>{' '}
          именно из-за перезапуска <code>hitl</code>. Вердикт PM пишет <code>RemarksService.verdict</code> до resume,
          идемпотентно по <code>(runId, idempotencyKey)</code> — один путь записи для REST, WS и MCP.
        </p>
      </ProjectNote>

      <KeyIdea>
        HITL = checkpointer + thread_id + interrupt() + Command(resume). При resume нода с interrupt стартует с начала,
        поэтому побочные эффекты — в отдельную ноду или идемпотентно, а несколько пауз подряд вызывающий код
        обрабатывает циклом while.
        interrupt_before — для отладки. Чекпоинты в Postgres с durability sync переживают рестарт.
      </KeyIdea>
    </>
  )
}

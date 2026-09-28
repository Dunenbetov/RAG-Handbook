import { Link } from 'react-router-dom'
import { Callout, Formula, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { TraceTree } from '../../components/interactive/TraceTree'

export default function Lesson() {
  return (
    <>
      <Section title="Словарь: одно и то же в трёх инструментах">
        <p>
          <Term id="trace">Trace</Term> — дерево всего, что произошло за один запрос: от входа до ответа, с общим{' '}
          <code>trace_id</code>, суммарной latency, токенами и ценой. Узел дерева — <Term id="span">span</Term>: имя, start/end,
          родитель, вход, выход, атрибуты. Дальше инструменты называют вещи по-разному:
        </p>
        <Tbl
          head={['Понятие', 'Langfuse', 'LangSmith', 'OTel / OpenInference']}
          rows={[
            ['Запрос целиком', 'trace', 'trace (корневой run)', 'trace'],
            ['Шаг', 'observation типа span (в SDK v3+ ещё agent, tool, chain, retriever, embedding…)', 'run с run_type chain, tool, retriever, embedding, prompt, parser', 'span, openinference.span.kind'],
            ['Вызов LLM', 'generation: model, usage, cost, prompt', 'run_type = llm', 'span kind LLM / gen_ai.*'],
            ['Точка во времени', 'event', '—', 'span event'],
            ['Диалог / серия', 'session (session_id)', 'thread: metadata session_id | thread_id | conversation_id', 'session.id (OpenInference)'],
            ['Фильтры', 'user_id, tags, metadata, environment', 'tags, metadata', 'user.id, tag.tags, metadata'],
            ['Оценка', 'score (числовой, булев, категориальный)', 'feedback', '—'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Слайд 7 называет узлы LangSmith spans. В LangSmith это <strong>runs</strong> с полем <code>run_type</code>, и
            список типов на слайде неполный: кроме <code>llm</code>, <code>chain</code>, <code>tool</code>,{' '}
            <code>retriever</code> есть <code>embedding</code>, <code>prompt</code> и <code>parser</code>.
          </p>
        </Callout>
      </Section>

      <Section title="Трейс одного разбора замечания">
        <p>
          Ниже — прогон графа triage так, как его показывает Langfuse. Ноды LangGraph — span’ы, вызовы OpenAI — generation с
          моделью и usage, поиск — retriever с вложенным embedding. Кликни узел, чтобы увидеть детали, и включи подсветку самого
          дорогого и самого медленного шага.
        </p>
        <TraceTree />
        <p>
          Как искать узкое место в настоящем Langfuse: открой трейс (timeline покажет, где ушло время) или таблицу
          observations с фильтром по трейсу и отсортируй по cost или latency. Смотри на <strong>листья</strong> (generation, retriever), а не на родительские span’ы: у родителя время включает детей.
          Для систематики фильтруй observations по имени (<code>classify</code>, <code>draft</code>) и сравнивай cost и
          p95 за период, а не по одному трейсу.
        </p>
      </Section>

      <Section title="Откуда cost и почему две цифры не совпадают">
        <p>
          Трейсер не знает цену: он умножает usage, который вернул провайдер, на прайс модели. Прайс встроенный или заданный
          вручную; cost можно и передать готовым.
        </p>
        <Formula note="прайс за 1M токенов; cached — часть input, которую провайдер взял из prompt cache">
          cost = (in − cached)·p_in + cached·p_cached + out·p_out
        </Formula>
        <p>
          В remark-round свой <code>pricing.ts</code> сознательно не читает <code className="break-all">prompt_tokens_details.cached_tokens</code>,
          а Langfuse читает. У gpt-4.1-mini кэшированный вход вчетверо дешевле, а системный промпт шагов со Skill одинаков
          от вызова к вызову. Итог сверки на прогоне <code>live-base-2</code>: $0,1358 по своему прайсу против $0,1127 в
          Langfuse, на 17% ниже.
        </p>
        <Callout type="tip" title="Вопрос на защите">
          <p>
            «Сколько стоит один разбор?» — На golden $0,0033 и 3,8 с p50; на проде около $0,0048 и 6,7 с p50 (n = 10),
            потому что кадр есть почти всегда и документы длиннее. Реальный счёт ниже нашей цифры примерно на 17% из-за
            prompt cache. Цифры 04.09 ($0,0079) были завышены ошибкой прайса: gpt-4.1-mini считалась по цене gpt-4.1,
            исправлено 18.09.
          </p>
        </Callout>
      </Section>

      <Section title="Interrupt и resume: как не порвать трейс">
        <p>
          HITL-граф останавливается на <code>interrupt()</code>, а продолжается через часы, из другого HTTP-запроса (механика —
          в уроке <Link to="/ch8/hitl" className="text-accent hover:underline">про checkpointer и HITL</Link>). По умолчанию
          продолжение станет новым трейсом без связи с первым. Два способа склеить:
        </p>
        <ul>
          <li>
            <strong>Session.</strong> Оба трейса получают один <code>sessionId</code> (в remark-round это <code>remarkId</code>).
            Langfuse покажет их рядом, это минимум.
          </li>
          <li>
            <strong>Один trace.</strong> <code>traceId</code> вычисляется из <code>runId</code> детерминированно, и{' '}
            <code>triage.resume</code> ложится в тот же trace вторым корневым span’ом. Так сделано в remark-round.
          </li>
        </ul>
        <CodeBlock
          language="typescript"
          title="observability.service.ts (сокращено): один trace на прогон"
          code={`static traceIdOf(runId: string): string {
  return createHash('sha256').update(runId).digest('hex').slice(0, 32)
}

run<T>(t: RunTrace, fn: (span: LangfuseSpan) => Promise<T>) {
  const traceId = ObservabilityService.traceIdOf(t.runId)
  return startActiveObservation(
    t.resume ? \`\${t.mode}.resume\` : t.mode,
    (span) => propagateAttributes(
      { userId: t.userId, sessionId: t.remarkId, tags: [t.mode] },
      () => fn(span),
    ),
    // traceId задаётся через фиктивного родителя: одинаков у старта и у resume
    { asType: 'agent', parentSpanContext: { traceId, spanId: t.resume ? RESUME_PARENT : ROOT_PARENT, traceFlags: 1 } },
  )
}`}
        />
        <Callout type="tip" title="Вопрос на защите">
          <p>
            «Почему span <code>hitl</code> в Langfuse красный — это ошибка?» — Нет. <code>interrupt()</code> реализован
            через исключение GraphInterrupt, трейсер видит его как ошибку span’а. Это пауза до решения PM, состояние в
            чекпоинтере; продолжение — <code>triage.resume</code> в том же trace.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В <code className="break-all">apps/api/src/observability/observability.service.ts</code> три входа: <code>run()</code> — корневой span
          прогона с userId, sessionId = remarkId, тегами и metadata; <code>callbacks()</code> — <code>CallbackHandler</code>{' '}
          для нод LangGraph; <code>openai()</code> — <code>observeOpenAI</code>, каждый вызов которого становится generation с
          именем ноды (<code>classify</code>, <code>draft</code>, <code>vision</code>). Поиск размечен в{' '}
          <code>rag.service.ts</code> (<code>asType: 'retriever'</code>) и <code>embeddings.service.ts</code> (
          <code>'embedding'</code>). На карточке замечания есть ссылка «Трейс в Langfuse» (<code>traceUrl(runId)</code>) —
          открой её на демо.
        </p>
      </ProjectNote>

      <KeyIdea>
        Trace — дерево одного запроса, span — шаг, generation — вызов LLM с usage и cost, session — серия трейсов. Cost —
        это usage × прайс, поэтому свой прайс и Langfuse расходятся на prompt cache. Детерминированный traceId из runId
        склеивает interrupt и resume в один трейс.
      </KeyIdea>
    </>
  )
}

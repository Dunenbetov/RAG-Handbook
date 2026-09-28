import { Database, FlaskConical, GitCommitHorizontal, Radar, Rocket, ScrollText } from 'lucide-react'
import { Callout, KeyIdea, ProjectNote, Section, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { StepPlayer, type Stage } from '../../components/interactive/StepPlayer'

const CYCLE: Stage[] = [
  {
    icon: ScrollText,
    title: 'Прод-трейсы',
    detail: 'Смотришь трейсы боевого трафика и ищешь аномалии: дорогие, медленные, с плохим score. В remark-round так нашли, что шаг rewrite упирается в лимит токенов.',
    example: 'Langfuse, environment=production (данные на 23.09)\nrewrite_query: finishReason = "length" в 4 вызовах из 5',
  },
  {
    icon: Database,
    title: 'Датасет',
    detail: 'Плохие трейсы превращаешь в кейсы golden-датасета: вход, ожидаемый ответ, что запрещено. Трейс в один клик становится тестом.',
    example: '// новый кейс (пример)\n{ "id": "rewrite-long-remark", "gold": { "expect": ["defect_candidate"], "section": "§2.1" } }',
  },
  {
    icon: FlaskConical,
    title: 'Evals',
    detail: 'Прогоняешь текущую версию по датасету и фиксируешь базу: метрики, цену, латентность. Без базы «стало лучше» не доказать.',
    example: 'pnpm evals → binding 28/33, $0,0033, p50 3,8 с',
  },
  {
    icon: GitCommitHorizontal,
    title: 'Изменение',
    detail: 'Меняешь один фактор (промпт, модель, лимит) и прогоняешь те же кейсы. Сравниваешь с базой с учётом шума.',
    example: 'llm-params.ts: maxTokens.rewrite 60 → 120\n(переключателя для rewrite пока нет: его надо добавить)',
  },
  {
    icon: Rocket,
    title: 'Деплой',
    detail: 'Изменение идёт в прод только через регрессионный гейт в CI. Порог подобран так, чтобы тривиальная система его не проходила.',
    example: 'CI: pnpm evals -- --offline, EVALS_MIN_BINDING=0.65',
  },
  {
    icon: Radar,
    title: 'Мониторинг',
    detail: 'Снова смотришь прод: цена, p95, доля обрезанных ответов, фидбек людей. Новые аномалии возвращают тебя к первому шагу.',
    example: 'finishReason = "length" у rewrite: было 4 из 5 → ?\nпотолок $20/день на проект → 409 llm_budget',
  },
]

export default function Lesson() {
  return (
    <>
      <Section title="LLMOps — это цикл, а не конвейер">
        <p>
          <strong>LLMOps</strong> — практики и инструменты для жизненного цикла LLM-приложения. На лекции это нарисовано
          линейкой: разработка → evals → деплой → observability. В жизни это <strong>кольцо</strong>: плохие прод-трейсы
          становятся кейсами <Term id="golden-dataset">golden dataset</Term>, на них меряют изменение, изменение деплоят,
          и снова смотрят прод. Пройди цикл по шагам на примере remark-round.
        </p>
        <StepPlayer title="Цикл LLMOps на одном реальном сигнале" icon={Radar} stages={CYCLE} />
        <Callout type="info">
          <p>
            Реален в remark-round только первый шаг: обрезку rewrite на лимите 60 токенов увидели в трейсах Langfuse Cloud.
            Шаги 2–6 — как замкнуть цикл: кейс в golden не добавляли, лимит не меняли. Это честный ответ на вопрос «что
            сломано сейчас».
          </p>
        </Callout>
      </Section>

      <Section title="Monitoring vs observability">
        <VS
          left={{
            title: 'Monitoring: «что случилось?»',
            tone: 'neutral',
            children: (
              <p>
                Заранее известные метрики и алерты: latency p50/p95, error rate, RPS, стоимость в день. Отвечает, что
                система больна, но не почему.
              </p>
            ),
          }}
          right={{
            title: 'Observability: «почему случилось?»',
            tone: 'good',
            children: (
              <p>
                Можно разобрать <em>любой</em> запрос по шагам, даже тот, о котором заранее не думал: какой промпт ушёл, что
                вернул retriever, где потерялось время.
              </p>
            ),
          }}
        />
        <Tbl
          head={['Столп', 'Что даёт', 'Пример в LLM-приложении']}
          rows={[
            ['Логи', 'события в тексте', '«ключи Langfuse заданы, но span’ы не доедут»'],
            ['Метрики', 'агрегаты во времени', 'p95 разбора 9,9 с, $0,0048 на разбор'],
            ['Трейсы', 'дерево шагов одного запроса', 'triage → retrieve_docs → classify → draft → hitl'],
            ['Качество (для LLM)', 'scores и evals', 'binding 28/33, оценка судьи, фидбек пользователя'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Слайд 3 определяет observability как понимание системы «по логам и метрикам». Трейсы не упомянуты, а для агентов
            это главный столп: без дерева шагов не видно, в какой ноде ушли деньги. Для LLM добавляется четвёртый столп —
            качество. И в заголовке стоит OpenTelemetry, но определения нет: OTel — это стандарт и протокол телеметрии,
            tracing — метод, observability — цель.
          </p>
        </Callout>
      </Section>

      <Section title="OpenTelemetry: стандарт, а не инструмент">
        <p>
          <Term id="opentelemetry">OpenTelemetry</Term> (CNCF) — вендор-нейтральные API, SDK и протокол OTLP для трейсов,
          метрик и логов. Три объекта, которые надо знать: <code>TracerProvider</code> выдаёт tracer’ы, которые создают span’ы,{' '}
          <code>SpanProcessor</code> решает, когда их отдавать, <code>SpanExporter</code> отправляет их по OTLP в бэкенд.
        </p>
        <CodeBlock
          language="python"
          title="OTel в проде: batch-процессор и OTLP-экспорт"
          code={`from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
# Batch копит span'ы и шлёт пачкой в фоне; Simple шлёт каждый синхронно (только для отладки)
provider.add_span_processor(BatchSpanProcessor(
    OTLPSpanExporter(endpoint="http://localhost:6006/v1/traces")  # Phoenix
))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("rag")
with tracer.start_as_current_span("rag_query"):
    ...  # вложенные span'ы retriever и llm станут детьми

provider.shutdown()  # на выходе: дослать хвост батча`}
        />
        <p>
          Сам OTel не знает, что такое промпт и токены. Это добавляют семантические конвенции:{' '}
          <Term id="openinference">OpenInference</Term> от Arize (<code>openinference.span.kind = LLM | RETRIEVER | TOOL…</code>,{' '}
          <code>llm.token_count.prompt</code>) и собственные GenAI-конвенции OTel (<code>gen_ai.request.model</code>,{' '}
          <code>gen_ai.usage.input_tokens</code>). Phoenix, Langfuse и LangSmith принимают такие span’ы по OTLP.
        </p>
        <Callout type="tip" title="Вопрос на защите">
          <p>
            «Зачем OTel, если у Langfuse свой SDK?» — SDK Langfuse для JS и Python сам построен на OTel: span’ы стандартные,
            контекст общий с другими инструментаторами. Это снижает vendor lock-in: при переезде на Phoenix или LangSmith
            меняются обёртки в одном <code>observability.service.ts</code>, а не код нод. Но «сменил exporter — и всё» не выйдет:
            атрибуты <code>langfuse.*</code> другие бэкенды не понимают.
          </p>
        </Callout>
      </Section>

      <Section title="Build vs buy">
        <Tbl
          head={['Вариант', 'Плюсы', 'Минусы']}
          rows={[
            ['Своё: логи и таблица в БД', 'полный контроль, $0, работает без внешнего сервиса', 'нет дерева, UI, сравнения версий'],
            ['Open source self-host (Langfuse, Phoenix)', 'данные у тебя, без лицензий за seat', 'надо держать инфраструктуру'],
            ['SaaS (LangSmith, Langfuse Cloud)', 'ноль ops, готовые datasets и experiments', 'данные у вендора, цена растёт с объёмом'],
          ]}
        />
        <p>
          В remark-round совмещены свой учёт и готовый инструмент, и каждый делает своё. Стоимость каждого прогона пишется в свою базу
          (<code>AgentRun.costUsd</code> через <code>pricing.ts</code>): на ней держится дневной потолок $20 на проект, и он
          не должен зависеть от доступности внешнего сервиса. Дерево шагов, sessions и сравнение прогонов — в Langfuse:
          локально self-host в docker compose, на проде Langfuse Cloud.
        </p>
      </Section>

      <ProjectNote>
        <p>
          Как это звучит на защите: в <code className="break-all">apps/api/src/observability/observability.service.ts</code> у Langfuse{' '}
          <strong>изолированный</strong> <code>NodeTracerProvider</code>. Причина: <code>Sentry.init</code> до старта Nest
          занимает глобальный OTel-провайдер, даже при <code>tracesSampleRate: 0</code>. Старый <code>provider.register()</code>{' '}
          молча проигрывал, span’ы создавал провайдер Sentry, и в Langfuse Cloud не доезжало ничего, хотя /health писал «on».
        </p>
        <p>
          Исправление по официальному рецепту Langfuse «рядом с Sentry»: свой провайдер с <code>LangfuseSpanProcessor</code>{' '}
          передан через <code>setLangfuseTracerProvider</code>, sampler <code>AlwaysOnSampler</code> (иначе ParentBased выбросил
          бы span’ы под несэмплированным span’ом Sentry), а /health честно показывает <code>on | degraded | off</code>.
        </p>
      </ProjectNote>

      <KeyIdea>
        LLMOps — кольцо: трейсы → датасет → evals → изменение → гейт → мониторинг. Observability отвечает «почему», и для
        агента её основа — трейсы плюс scores качества. OpenTelemetry делает трейсы переносимыми между Langfuse, Phoenix и
        LangSmith.
      </KeyIdea>
    </>
  )
}

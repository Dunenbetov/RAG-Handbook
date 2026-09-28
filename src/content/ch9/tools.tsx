import { Callout, KeyIdea, ProjectNote, Section, Tbl, Warn, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Три инструмента в одной таблице">
        <Tbl
          head={['', 'Langfuse', 'LangSmith', 'Arize Phoenix']}
          rows={[
            ['Лицензия', 'ядро MIT; фичи из /ee (RBAC проекта, audit logs, retention) — по ключу', 'проприетарный SaaS (US/EU)', 'Elastic License 2.0: source-available, не OSI open source'],
            ['Self-host', <><Yes />бесплатно; v3 — web, worker, Postgres, ClickHouse, Redis, S3</>, <><Warn />только Enterprise, license key, Helm/K8s</>, <><Yes />бесплатно, один Docker-контейнер, без feature gates</>],
            ['Основа', 'SDK на OTel, принимает OTLP', 'свой SDK (@traceable, wrap_openai) + приём OTLP', 'OTel + OpenInference нативно'],
            ['Сильное', 'cost и usage, sessions, users, scores, prompt management, datasets', 'связка с LangChain/LangGraph, datasets, experiments, annotation queues', 'локальная отладка RAG, phoenix.evals, experiments'],
            ['Минусы', 'тяжёлый self-host', 'vendor lock-in, цена на объёме', 'слабее продуктовая аналитика; ELv2 запрещает продавать как managed-сервис'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <ul>
            <li>
              Слайд 5: у LangSmith «проблемы с on-premise». Self-host есть (Docker, Kubernetes), просто только в платном
              Enterprise. И LangSmith не только для LangChain: <code>@traceable</code>, <code>wrap_openai</code> и OTLP работают
              с любым кодом.
            </li>
            <li>
              Слайд 8: «Arize Phneix» — Phoenix. Open source в строгом смысле здесь только Langfuse (MIT), у Phoenix ELv2.
              «Детальная аналитика затрат и сбор фидбека» — сильная сторона прежде всего Langfuse.
            </li>
          </ul>
        </Callout>
      </Section>

      <Section title="Интеграция: три сниппета">
        <p>
          <strong>Langfuse + LangGraph</strong> — через LangChain callbacks: каждая нода, каждый вызов ChatOpenAI (generation
          с usage и cost) и каждый tool становятся observations. Атрибуты трейса — ключами <code>langfuse_*</code> в metadata.
        </p>
        <CodeBlock
          language="python"
          title="Langfuse SDK v3+: callback + session + flush"
          code={`from langfuse import get_client
from langfuse.langchain import CallbackHandler

langfuse = get_client()                      # ключи и адрес из env
config = {
    "configurable": {"thread_id": dialog_id},  # один на весь диалог
    "callbacks": [CallbackHandler()],
    "metadata": {
        "langfuse_session_id": dialog_id,      # а не новый id на каждое сообщение
        "langfuse_user_id": "demo_student",
        "langfuse_tags": ["case2", "demo"],
    },
}
try:
    result = graph.invoke({"messages": [HumanMessage(q)]}, config=config)
finally:
    langfuse.flush()   # экспорт батчевый и асинхронный: без flush хвост теряется`}
        />
        <p>
          <strong>LangSmith</strong> — LangChain и LangGraph трейсятся сами по переменным окружения. Всё, что идёт мимо
          LangChain (прямой openai SDK, свои функции), надо обернуть.
        </p>
        <CodeBlock
          language="python"
          title="LangSmith: env + wrap_openai + @traceable"
          code={`# env: LANGSMITH_TRACING=true, LANGSMITH_API_KEY=..., LANGSMITH_PROJECT=case2
import openai
from langsmith import traceable
from langsmith.wrappers import wrap_openai

client = wrap_openai(openai.OpenAI())         # прямые вызовы SDK → run_type="llm"

@traceable(run_type="retriever", name="search_docs")
def search_docs(q: str) -> list[str]: ...

@traceable(name="rag_answer")                 # родитель: всё внутри — одно дерево
def rag_answer(q: str) -> str:
    docs = search_docs(q)
    r = client.chat.completions.create(model="gpt-4.1-mini", messages=build(q, docs))
    return r.choices[0].message.content`}
        />
        <p>
          <strong>Phoenix</strong> — чистый OTel: <code>register()</code> создаёт провайдер, инструментатор{' '}
          <Term id="openinference">OpenInference</Term> вешается на LangChain.
        </p>
        <CodeBlock
          language="python"
          title="Phoenix: register + LangChainInstrumentor + родительский span"
          code={`from phoenix.otel import register
from openinference.instrumentation.langchain import LangChainInstrumentor

# PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006
tracer_provider = register(project_name="rag-eval", batch=True)  # по умолчанию batch=False
LangChainInstrumentor().instrument(tracer_provider=tracer_provider)

tracer = tracer_provider.get_tracer(__name__)
with tracer.start_as_current_span("rag_query"):   # retriever и llm — в одном трейсе
    docs = retriever.invoke(q)
    answer = llm.invoke(prompt.format(context=docs, question=q))`}
        />
      </Section>

      <Section title="Шесть ошибок лекционного кода">
        <Tbl
          head={['Где', 'Ошибка', 'Чем грозит', 'Как правильно']}
          rows={[
            ['оба agent-скрипта', 'flush только в конце main(), не в finally; в langsmith-скрипте явного flush нет', 'при падении, в воркере или serverless хвост батча теряется', 'flush() / shutdown() в finally или на остановке приложения'],
            ['оба agent-скрипта', 'thread_id += 1 на каждое сообщение; он же уходит в session_{thread_id} (Langfuse) и metadata thread_id (LangSmith)', 'каждая реплика — новый тред LangGraph без памяти и новая сессия в трейсере', 'один thread_id и один session_id на диалог'],
            ['agent_case2_langfuse.py', 'LlamaIndexInstrumentor есть в инструкции установки, но не вызывается', 'поиск, эмбеддинги и LLM-синтез LlamaIndex невидимы вместе с их cost', 'get_client(); LlamaIndexInstrumentor().instrument() — span’ы лягут в общий OTel-контекст'],
            ['agent_case2_langsmith.py', 'отдельный TracerProvider для LlamaIndex, без заголовка Langsmith-Project', 'span’ы LlamaIndex — отдельные корневые трейсы, да ещё в проекте default', 'один провайдер и контекст на процесс, заголовок проекта'],
            ['agent_case2_langsmith.py', 'SimpleSpanProcessor', 'синхронный экспорт каждого span’а добавляет latency к запросу', 'BatchSpanProcessor + shutdown() на выходе'],
            ['rag_eval_phoenix.py', 'retriever.invoke и llm.invoke без родительского span’а', 'на каждый вопрос два несвязанных трейса', 'LCEL-цепочка или start_as_current_span("rag_query")'],
          ]}
        />
        <p>
          Бонус: в <code>rag_eval_phoenix.py</code> адрес по умолчанию <code>localhost:8765</code>, а docstring обещает{' '}
          <code>6006</code> — стандартный порт Phoenix. И подсказка поднять Phoenix из <code className="break-all">docker-compose.langfuse.yml</code>{' '}
          путает стеки; самого файла в материалах нет.
        </p>
      </Section>

      <Section title="Почему Langfuse, а не LangSmith">
        <Callout type="tip" title="Вопрос на защите">
          <p>
            «Почему Langfuse?» — Ядро open source (MIT) и бесплатный self-host: замечания и скриншоты заказчика можно держать
            у себя, локально Langfuse поднят в docker compose; на проде — Langfuse Cloud, потому что self-host стек (6
            контейнеров, ClickHouse) не уместился в память сервера. SDK построен на OpenTelemetry, и traceId задаём сами. Учёт
            cost, sessions, users и scores есть из коробки. LangSmith удобнее в чистом LangChain-стеке, но self-host у него
            только в Enterprise. Честно: выбор сделан на старте, без сравнительной таблицы, а переезд — это переписать модуль
            observability и разметку поиска, но не код нод.
          </p>
        </Callout>
        <Callout type="warn" title="Поправка к DEFENSE-QA Q24">
          <p>
            «LangSmith включился бы двумя переменными» — неточно. По env LangSmith трейсит ноды LangGraph, но remark-round
            зовёт <code>openai</code> SDK напрямую, мимо LangChain. Эти вызовы без <code>wrapOpenAI(new OpenAI())</code> или{' '}
            <code>traceable</code> в трейс не попадут, то есть главные данные о модели, токенах и цене. По той же причине для
            Langfuse в проекте стоит <code>observeOpenAI</code>.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В <code className="break-all">apps/api/src/observability/observability.service.ts</code> две точки подключения:{' '}
          <code>new CallbackHandler({'{'} userId, sessionId, tags {'}'})</code> из <code>@langfuse/langchain</code> для нод графа и{' '}
          <code>observeOpenAI(client, {'{'} generationName: node {'}'})</code> из <code>@langfuse/openai</code> для каждого вызова
          модели. Экспорт батчевый (<code>LangfuseSpanProcessor</code> с <code>flushAt: 20</code>, <code>flushInterval: 2</code>),{' '}
          <code>provider.shutdown()</code> — на остановке Nest. Прогоны evals пишутся с <code>environment=evals</code>, боевые —
          с <code>production</code>, так они не смешиваются на дашборде.
        </p>
        <p>
          Честная оговорка на случай вопроса про данные: на проде тексты замечаний и кадры уходят в OpenAI и Langfuse Cloud
          без маскирования, это решение записано в ADR 015. Self-host Langfuse как раз закрывает этот риск, если он станет
          важен.
        </p>
      </ProjectNote>

      <KeyIdea>
        Langfuse — open source и self-host, LangSmith — лучший SaaS для LangChain, Phoenix — бесплатный OTel-нативный
        инструмент под ELv2. Интеграция везде — провайдер плюс инструментатор; типичные ошибки — нет flush, сессия на каждое
        сообщение и span’ы без общего родителя. Вызовы мимо LangChain нужно оборачивать отдельно в любом инструменте.
      </KeyIdea>
    </>
  )
}

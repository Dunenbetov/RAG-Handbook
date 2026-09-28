import { Link } from 'react-router-dom'
import { Callout, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Топологии и handoff">
        <p>
          Мультиагентная система — несколько специализированных агентов, каждый со своим промптом, tools и окном. Сила подхода —
          специализация, параллелизм и изоляция контекста. Цена — токены и сложность координации.
        </p>
        <Tbl
          head={['Топология', 'Как устроено', 'Когда уместна', 'Риск']}
          rows={[
            ['Orchestrator → workers', 'Оркестратор делит задачу, воркеры работают параллельно, он же собирает итог', 'широкий поиск, research', 'оркестратор — узкое место'],
            ['Pipeline', 'Plan → Research → Write → Review, результат передаётся дальше', 'этапы с разной экспертизой', 'ошибка на входе протекает до конца'],
            ['Supervisor', 'Центральный агент решает, кому отдать следующий шаг, результат возвращается к нему', 'разнородные специалисты', 'лишний LLM-вызов на каждый переход'],
            ['Peer-to-peer / swarm', 'Агенты передают управление друг другу напрямую', 'диалог: поддержка → биллинг', 'петли, трудно отлаживать'],
            ['Hierarchical', 'Супервизоры над супервизорами', 'очень большие системы', 'цена и задержка растут с каждым уровнем'],
          ]}
        />
        <p>
          <strong>Handoff</strong> — передача управления вместе с контекстом. Хорошая практика — передавать сжатый результат, а не
          всю историю. В LangGraph handoff выражается через <code>{`Command(goto="billing", update={...})`}</code>.
        </p>
      </Section>

      <Section title="Когда мультиагенты не нужны">
        <p>
          Anthropic (Multi-agent research system, 2025): их мультиагентная система тратила примерно в 15 раз больше токенов, чем
          чат, и на внутреннем исследовательском eval обошла одиночного агента примерно на 90%. Выигрыш пришёлся на широкие
          задачи, которые делятся на независимые ветки поиска. Контраргумент — эссе Cognition «Don't build multi-agents»: контекст
          дробится, и действия агентов несут неявные решения, которые конфликтуют между собой.
        </p>
        <Callout type="info" title="Правило">
          <p>
            Мультиагенты оправданы, когда подзадачи независимы, параллельны и в основном читают данные. Если шаги сильно связаны и
            пишут общее состояние, лучше один агент или граф с хорошим контекстом.
          </p>
        </Callout>
        <CodeBlock
          language="python"
          title="Неточность в коде лекции: «параллелизм», который идёт последовательно"
          code={`# в коде лекции retriever и webscout идут по очереди; параллельно так:
ret_task, web_task = await asyncio.gather(
    AGENTS["retriever"].send_text("retrieve", data={"query": q, "top_k": top_k}),
    AGENTS["webscout"].send_text("web_search", data={"query": q}),
)`}
        />
        <Callout type="tip" title="Вопрос на защите">
          <p>
            <em>«Почему не мультиагентная система?»</em> — Одна карточка замечания, одно решение, один человек, который его
            принимает. Шаги сильно связаны: классификация зависит от найденной цитаты, черновик — от класса, и распараллелить
            нечего. Мультиагенты умножили бы токены (у Anthropic около 15×) и добавили бы координацию, а выигрыш у них бывает
            как раз на параллельных ветках, которых здесь нет.
            Внешний агент в системе всё-таки есть — Claude Code через MCP.
          </p>
        </Callout>
      </Section>

      <Section title="A2A: протокол агент ↔ агент">
        <p>
          <Term id="a2a">A2A</Term> — открытый протокол Google (2025), с июня 2025 развивается под Linux Foundation. Он связывает
          агентов из разных систем, которые не делят код и не показывают друг другу внутренности. Базовый транспорт — HTTP, JSON-RPC 2.0,
          SSE для стриминга (с v0.3 есть также gRPC и REST). Роли: user, client agent (отправляет задачу) и remote agent (исполняет).
        </p>
        <ul>
          <li>
            <Term id="agent-card">Agent Card</Term> — JSON-манифест по адресу <code>/.well-known/agent-card.json</code>: name,
            description, url, version, capabilities (streaming, pushNotifications), skills, схемы авторизации.
          </li>
          <li>
            Методы (нотация v0.3, как на слайдах): <code>message/send</code>, <code>message/stream</code>, <code>tasks/get</code>,{' '}
            <code>tasks/cancel</code>, <code>tasks/resubscribe</code>.
          </li>
          <li>
            <strong>Task</strong> — единица работы с id и contextId. Статусы: submitted → working → input-required → completed /
            failed / canceled, плюс rejected и auth-required.
          </li>
          <li>
            <strong>Message</strong> (role user / agent) состоит из <strong>Part</strong>: text, file (URI или base64), data (JSON).{' '}
            <strong>Artifact</strong> — результат задачи, тоже из parts.
          </li>
          <li>Как получить результат: polling через tasks/get (быстрые задачи), SSE (длинные с прогрессом), push-webhook (фоновые).</li>
        </ul>
        <CodeBlock
          language="json"
          title="message/send (v0.3)"
          code={`{
  "jsonrpc": "2.0", "id": 1, "method": "message/send",
  "params": { "message": {
    "role": "user", "messageId": "msg-1",
    "parts": [
      { "kind": "text", "text": "Найди выручку за 2024" },
      { "kind": "data", "data": { "top_k": 6 } }
    ] } }
}`}
        />
        <Callout type="warn" title="Неточность в лекции">
          <ul>
            <li>
              В конспекте и коде карточка лежит по <code>/.well-known/agent.json</code>, а метод называется <code>tasks/send</code>.
              Это спецификация до v0.2/v0.3, слайды здесь правы.
            </li>
            <li>
              У Part дискриминатор — <code>kind</code>, а не <code>type</code>. Artifact устроен как{' '}
              <code>{`{artifactId, name, parts}`}</code>.
            </li>
            <li>
              Самописный сервер выполняет задачу синхронно внутри HTTP-запроса: статусов submitted и working снаружи не видно, нет
              contextId, стриминга и авторизации. Для демо годится, в продакшене бери <code>a2a-sdk</code>.
            </li>
          </ul>
        </Callout>
        <Callout type="info" title="Спецификация v1.0">
          <p>
            В стабильной v1.0 методы переименованы (<code>SendMessage</code>, <code>SendStreamingMessage</code>,{' '}
            <code>GetTask</code>, <code>CancelTask</code>), поле <code>kind</code> убрано — тип Part определяется ключом (
            <code>{`{"text": "..."}`}</code>), статусы в JSON выглядят как <code>TASK_STATE_COMPLETED</code>. Часть реализаций,
            например A2A-эндпоинт LangGraph Agent Server, пока принимает нотацию v0.3. На защите называй v0.3 и упомяни переименование.
          </p>
        </Callout>
      </Section>

      <Section title="MCP, A2A и LangGraph: три разных уровня">
        <Tbl
          head={['', 'MCP', 'A2A', 'LangGraph']}
          rows={[
            ['Что соединяет', 'агент ↔ инструменты и данные', 'агент ↔ агент, в том числе между компаниями', 'шаги внутри одного приложения'],
            ['Связь', 'JSON-RPC по stdio / Streamable HTTP', 'JSON-RPC по HTTP + SSE / push', 'вызовы функций, общий State'],
            ['Видимость', 'tools описаны схемами', 'агенты непрозрачны: только вход и выход', 'всё состояние видно'],
            ['В remark-round', <code key="mcp">apps/mcp/src/server.ts</code>, 'нет, не нужен', <code key="lg">triage.graph.ts</code>],
          ]}
        />
        <p>
          Метафора лекции: LangGraph — солнечная система, A2A — галактика. Обычно их совмещают: внешний агент → A2A → твой граф на
          LangGraph → <Term id="mcp">MCP</Term> → инструменты. Сравнение MCP с обычным API —{' '}
          <Link to="/ch5/why-mcp" className="text-accent hover:underline">
            в главе 5
          </Link>
          .
        </p>
        <Callout type="warn" title="Неточность в лекции">
          <p>
            «LangGraph = один Python-процесс» — упрощение. Есть LangGraph.js (на нём remark-round), а LangGraph Agent Server сам
            отдаёт A2A-эндпоинт <code>/a2a/{'{assistant_id}'}</code>. LangGraph и A2A — разные уровни, а не выбор «или-или».
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В remark-round один граф в процессе NestJS и один внешний протокол — MCP (<code>apps/mcp/src/server.ts</code>: 4 tool'а и
          prompt <code>uat-triage</code>), тонкий фасад над тем же REST. Агентом с tool calling снаружи выступает Claude Code. Если
          понадобится, чтобы разбор заказывал чужой агент (например, агент баг-трекера), логичный путь — ещё один фасад, на этот раз
          A2A, поверх того же REST, по образцу MCP.
        </p>
      </ProjectNote>

      <KeyIdea>
        Мультиагенты окупаются на широких параллельных задачах и дорого стоят на связанных. MCP соединяет агента с
        инструментами, A2A — агента с агентом через Agent Card и Task, LangGraph управляет шагами внутри приложения.
      </KeyIdea>
    </>
  )
}

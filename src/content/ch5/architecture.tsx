import { Analogy, Callout, KeyIdea, ProjectNote, Section, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { MCPTopologyMap } from '../../components/interactive/MCPTopologyMap'

export default function Lesson() {
  return (
    <>
      <Section title="Три роли: Host, Client, Server">
        <p>
          MCP — не «ещё один API для LLM». Это <strong>протокол связи</strong> между тремя участниками. Разберём каждого —
          кликай по узлам на схеме ниже.
        </p>
        <MCPTopologyMap />
        <ul>
          <li>
            <strong>MCP Host</strong> — приложение, которое ты используешь: Cursor, Claude Desktop, IDE с агентом. Host
            содержит <Term id="llm">LLM</Term>, управляет диалогом и решает, когда вызывать tools.
          </li>
          <li>
            <strong>MCP Client</strong> — «переводчик» внутри host: один client = одно соединение с одним server. Host
            создаёт столько clients, сколько серверов подключено.
          </li>
          <li>
            <strong>MCP Server</strong> — процесс с capabilities: tools (действия), resources (данные), prompts (шаблоны).
            Может быть локальным (Python-скрипт на твоём ноутбуке) или удалённым (Context7 в облаке).
          </li>
        </ul>
        <Analogy>
          <p>
            Host — это офис-менеджер с LLM-мозгом. Client — выделенная телефонная линия к конкретному отделу. Server —
            сам отдел: бухгалтерия (Postgres), курьер (погода), архив (filesystem). Менеджер не звонит в бухгалтерию
            напрямую — он говорит client'у, client передаёт JSON-RPC server'у.
          </p>
        </Analogy>
      </Section>

      <Section title="Правило 1:1 — один client на один server">
        <p>
          Это не баг, а фича. Каждый MCP Client держит <strong>ровно одну сессию</strong> с одним server. Host с тремя
          серверами (weather, playwright, notes) создаёт три независимых client — они не мешают друг другу и могут
          работать параллельно.
        </p>
        <Callout type="tip">
          <p>
            Когда LLM вызывает <code>get_weather</code>, host знает, какому client'у принадлежит этот tool: после
            handshake каждый client получил от своего server список через <code>tools/list</code>. Маршрутизация
            прозрачна для модели.
          </p>
        </Callout>
      </Section>

      <Section title="Транспорт: STDIO vs Streamable HTTP">
        <VS
          left={{
            title: 'STDIO (локальный)',
            tone: 'good',
            children: (
              <ul>
                <li>Host запускает server как дочерний процесс</li>
                <li>Обмен через stdin/stdout — JSON-RPC строками</li>
                <li>Идеален для dev: FastMCP, filesystem, свой weather-сервер</li>
                <li>Не нужен сетевой порт, не нужен HTTPS</li>
              </ul>
            ),
          }}
          right={{
            title: 'Streamable HTTP (удалённый)',
            tone: 'neutral',
            children: (
              <ul>
                <li>Server живёт в облаке или на другой машине</li>
                <li>Один HTTP-endpoint: запросы идут POST, ответ — JSON или SSE-поток</li>
                <li>Context7, Figma, Sentry — типичные remote servers</li>
                <li>Нужна авторизация (OAuth, API key)</li>
              </ul>
            ),
          }}
        />
        <Callout type="warn" title="Не путай со старым HTTP+SSE">
          <p>
            В спецификации есть ровно два стандартных транспорта: <strong>stdio</strong> и <strong>Streamable HTTP</strong>.
            До Streamable HTTP удалённый транспорт назывался HTTP+SSE (ревизия 2024-11-05): два endpoint'а, долгоживущий GET-поток
            SSE для сообщений от server и отдельный POST для сообщений client. В ревизии 2025-03-26 его заменил
            Streamable HTTP с одним endpoint, а HTTP+SSE объявлен deprecated: SDK держат его только ради обратной
            совместимости, новые серверы на нём не пишут.
          </p>
          <p>
            Текущая ревизия 2026-07-28 упростила протокол ещё раз: из Streamable HTTP убраны протокольные сессии (
            <code>Mcp-Session-Id</code>) и отдельный GET-поток, а handshake <code>initialize</code> заменён метаданными в
            каждом запросе и методом <code>server/discover</code>. При этом <code>@modelcontextprotocol/sdk</code> 1.29 (стоит в
            remark-round) реализует ревизию 2025-11-25, с <code>initialize</code> и сессиями. На защите называй ту
            ревизию, которую поддерживает твой SDK.
          </p>
        </Callout>
        <CodeBlock
          language="json"
          title=".mcp.json — локальный STDIO-сервер"
          code={`{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["weather_server.py"]
    }
  }
}`}
        />
        <CodeBlock
          language="json"
          title=".mcp.json — удалённый HTTP-сервер"
          code={`{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "your-key"
      }
    }
  }
}`}
        />
      </Section>

      <Section title="JSON-RPC 2.0 — язык сообщений">
        <p>
          Внутри transport layer все сообщения — <strong>JSON-RPC 2.0</strong>. Client отправляет request с{' '}
          <code>method</code> и <code>params</code>, server отвечает <code>result</code> или <code>error</code>. Никакого
          REST, никакого gRPC — максимально простой формат, который легко парсить и логировать.
        </p>
        <Tbl
          head={['Method', 'Кто шлёт', 'Зачем']}
          rows={[
            ['initialize', 'Client → Server', 'Handshake: версия протокола, capabilities (ревизии до 2025-11-25; в 2026-07-28 заменён на server/discover)'],
            ['tools/list', 'Client → Server', 'Получить список доступных tools'],
            ['tools/call', 'Client → Server', 'Выполнить tool с аргументами'],
            ['resources/list', 'Client → Server', 'Список URI-ресурсов'],
            ['resources/read', 'Client → Server', 'Прочитать ресурс по URI'],
            ['prompts/list', 'Client → Server', 'Список шаблонов промптов'],
            ['prompts/get', 'Client → Server', 'Получить промпт с подставленными аргументами'],
          ]}
        />
        <CodeBlock
          language="json"
          title="tools/call — запрос и ответ"
          code={`// Client → Server
{
  "jsonrpc": "2.0",
  "id": 42,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "city": "Almaty" }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 42,
  "result": {
    "content": [{ "type": "text", "text": "{\\"temp\\": 22, \\"wind\\": 8}" }]
  }
}`}
        />
      </Section>

      <Section title="Локальные vs удалённые серверы">
        <p>
          <strong>Локальные</strong> (STDIO) — ты контролируешь код, данные не покидают машину. Подходят для filesystem,
          локальной БД, своих скриптов. Cursor запускает процесс при старте и убивает при закрытии.
        </p>
        <p>
          <strong>Удалённые</strong> (HTTP) — capabilities в облаке: свежая документация (Context7), браузерная
          автоматизация (Playwright hosted), мониторинг (Sentry). Платформа управляет инфраструктурой, ты платишь API key
          или подписку.
        </p>
        <Callout type="info">
          <p>
            На семинаре модуля 4 комбинируем оба типа: weather-сервер локально (Open-Meteo, бесплатно), Playwright —
            локально или remote, notes — локальный filesystem. Planner-агент в host видит tools всех серверов как единый
            список.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Когда пишешь свой сервер на FastMCP, <code>mcp.run()</code> по умолчанию поднимает STDIO-transport. Host
          (Cursor) сам запустит твой скрипт — тебе не нужно думать о портах и HTTP.
        </p>
      </ProjectNote>

      <KeyIdea>
        Host (приложение + LLM) → Client (1:1 сессия) → Server (tools/resources/prompts). STDIO для локальных
        серверов, Streamable HTTP для облачных. Внутри — JSON-RPC 2.0. Эта тройка повторяется для каждого подключённого
        server.
      </KeyIdea>
    </>
  )
}

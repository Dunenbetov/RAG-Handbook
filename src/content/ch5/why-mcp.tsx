import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { MxNvsMpNBoard } from '../../components/interactive/MxNvsMpNBoard'

export default function Lesson() {
  return (
    <>
      <Section title="Эпоха copy-paste: LLM без рук">
        <p>
          Первые месяцы после ChatGPT выглядели так: хочешь, чтобы модель «увидела» данные — копируешь их в чат. PDF в
          буфер обмена, таблица из Excel, лог ошибки на три экрана. Работало, пока документ помещался в{' '}
          <Term id="context-window">контекстное окно</Term> и пока ты не устал.
        </p>
        <p>
          Следующий шаг — <strong>ChatGPT Plugins</strong> (март 2023): OpenAI открыла «магазин приложений» внутри чата.
          Expedia, Wolfram, Zapier — каждый плагин со своим API, своей авторизацией, своим форматом описания. Работало
          красиво в демо, но экосистема так и не взлетела: разработчикам приходилось писать интеграцию под каждую
          платформу отдельно.
        </p>
        <p>
          Параллельно все API-модели получили <strong>Function Calling</strong> (tool use): модель возвращает не текст, а
          структурированный JSON «вызови функцию X с аргументами Y». Host выполняет функцию и отправляет результат обратно.
          Механизм мощный — но каждый хост (Cursor, Claude Desktop, LangChain, собственный бэкенд) описывал tools по-своему.
        </p>
      </Section>

      <Section title="Проблема N×M: интеграций слишком много">
        <p>
          Представь: 4 платформы (ChatGPT, Claude, Cursor, свой агент) и 6 инструментов (GitHub, Postgres, Slack, погода,
          браузер, файловая система). Без общего стандарта нужно <strong>N × M = 24</strong> отдельных интеграции — каждая
          пара «платформа ↔ инструмент» пишется с нуля.
        </p>
        <p>
          Подвигай слайдеры ниже: при 8 платформах и 12 tools mesh-интеграций уже 96. С MCP (шина «M + N») достаточно
          написать один сервер на tool и один клиент на платформу — и все соединяются через общий протокол.
        </p>
        <MxNvsMpNBoard />
        <Analogy title="MCP — это USB-C для AI">
          <p>
            До USB-C у каждого устройства был свой разъём: micro-USB, Lightning, проприетарный зарядник ноутбука. USB-C
            не заменил устройства — он стандартизировал <em>разъём</em>. MCP делает то же для LLM: не заменяет модели и
            не заменяет GitHub API, но даёт единый способ подключить любой инструмент к любому хосту.
          </p>
        </Analogy>
      </Section>

      <Section title="JSON Schema — ДНК протокола">
        <p>
          Function Calling уже использовал JSON Schema для описания аргументов tools. MCP взял эту идею и довёл до
          протокола: каждый tool, resource и prompt описывается схемой, которую host передаёт модели. Модель «видит» список
          доступных capabilities и решает, что вызвать — без хардкода в промпте.
        </p>
        <CodeBlock
          language="json"
          title="Tool в MCP — это JSON Schema + handler"
          code={`{
  "name": "get_weather",
  "description": "Текущая погода в городе",
  "inputSchema": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "Название города" }
    },
    "required": ["city"]
  }
}`}
        />
        <Callout type="info">
          <p>
            Host собирает схемы со всех подключённых MCP-серверов в единый список tools для{' '}
            <Term id="llm">LLM</Term>. Модель не знает, что за tool живёт на каком сервере — ей всё равно. Client
            маршрутизирует вызов на нужный server.
          </p>
        </Callout>
      </Section>

      <Section title="Хронология: от анонса до Linux Foundation">
        <Steps
          items={[
            {
              title: '25 ноября 2024 — Anthropic публикует MCP',
              body: 'Открытый протокол, SDK на Python и TypeScript, первые reference-серверы (filesystem, git, postgres). Идея: один стандарт вместо N×M интеграций.',
            },
            {
              title: 'Конец 2024 — первые adopters',
              body: 'Cursor, Claude Desktop, Zed, Sourcegraph добавляют MCP-клиенты. Сообщество пишет серверы: Context7, Playwright, Sentry, Figma.',
            },
            {
              title: '2025 — Streamable HTTP и зрелость экосystem',
              body: 'STDIO остаётся для локальных серверов, Streamable HTTP — для удалённых. Появляются FastMCP, официальные registry и best practices.',
            },
            {
              title: 'Декабрь 2025 — Linux Foundation / AAIF',
              body: 'MCP передаётся в Agentic AI Foundation под эгидой Linux Foundation (наряду с участниками вроде OpenAI, Google, AWS). Протокол становится отраслевым стандартом, а не проприетарной фичей одной компании.',
            },
          ]}
        />
        <Tbl
          head={['Подход', 'Плюсы', 'Минусы']}
          rows={[
            ['Copy-paste в чат', 'Ноль кода', 'Не масштабируется, нет автоматизации'],
            ['ChatGPT Plugins', 'Готовый UI', 'Закрытая экосystem, только OpenAI'],
            ['Function Calling (свой)', 'Гибкость', 'Каждый хост — свой формат tools'],
            ['MCP', 'Один сервер → все хосты', 'Нужно понять протокол (но это один раз)'],
          ]}
        />
      </Section>

      <ProjectNote>
        <p>
          В Project 5 (модуль 4) ты напишешь свой MCP-сервер на FastMCP и подключишь его к Cursor через{' '}
          <code>.mcp.json</code>. К этому моменту N×M-проблема перестанет быть абстракцией — ты сам станешь стороной «+1»
          в формуле M+N.
        </p>
      </ProjectNote>

      <KeyIdea>
        MCP решает проблему N×M интеграций: один MCP-сервер работает во всех MCP-хостах. JSON Schema — общий язык
        описания tools. Протокол открыт, передан в Linux Foundation и уже поддерживается Cursor, Claude Desktop и десятками
        community-серверов.
      </KeyIdea>
    </>
  )
}

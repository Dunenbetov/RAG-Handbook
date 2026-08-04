import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Не обязательно писать сервер с нуля">
        <p>
          Экосystem MCP уже насчитывает сотни готовых серверов. Для большинства задач курса достаточно подключить три
          community-сервера в <code>.mcp.json</code> — и <Term id="llm">LLM</Term> в Cursor получит tools для документации,
          браузера и автоматизации.
        </p>
        <Analogy>
          <p>
            Писать свой MCP-сервер с нуля — как писать драйвер USB-C для каждой флешки. Иногда нужно (свой weather API,
            внутренняя CRM), но для стандартных задач бери готовый «адаптер» из registry.
          </p>
        </Analogy>
      </Section>

      <Section title="Context7 — свежая документация">
        <p>
          <strong>Context7</strong> решает проблему <Term id="knowledge-cutoff">knowledge cutoff</Term> для библиотек.
          Вместо того чтобы полагаться на устаревшие знания модели о React 18, LLM вызывает tool{' '}
          <code>query-docs</code> и получает актуальные примеры из официальной документации.
        </p>
        <Tbl
          head={['Tool', 'Что делает']}
          rows={[
            ['resolve-library-id', 'Находит ID библиотеки по названию (Next.js, FastMCP, LangChain…)'],
            ['query-docs', 'Возвращает релевантные фрагменты документации по запросу'],
          ]}
        />
        <Callout type="tip">
          <p>
            Попроси Cursor: «Как в FastMCP объявить tool без скобок у декоратора?» — агент сам вызовет Context7, если
            сервер подключён. Без MCP модель ответила бы из training data и могла бы ошибиться в синтаксисе v3.
          </p>
        </Callout>
        <CodeBlock
          language="json"
          title="Context7 в .mcp.json"
          code={`{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    }
  }
}`}
        />
      </Section>

      <Section title="Chrome DevTools MCP — браузер глазами агента">
        <p>
          <strong>Chrome DevTools MCP</strong> даёт LLM доступ к реальному Chromium: навигация, DOM-сnapshot, скриншоты,
          console logs, network requests. Это «глаза» для отладки фронтенда и проверки вёрстки без ручного copy-paste HTML.
        </p>
        <Steps
          items={[
            {
              title: 'navigate_page',
              body: 'Открыть URL в headless или attached Chrome. Агент переходит на localhost:5173 или продакшн-сайт.',
            },
            {
              title: 'take_snapshot',
              body: 'Accessibility-tree страницы: структура элементов с ref-id для кликов. LLM «видит» DOM без скриншота.',
            },
            {
              title: 'take_screenshot',
              body: 'PNG текущего viewport — для визуальной проверки: «кнопка не наезжает на заголовок?»',
            },
            {
              title: 'list_console_messages / list_network_requests',
              body: 'Логи и сетевые запросы — отладка JS-ошибок и медленных API без DevTools руками.',
            },
          ]}
        />
        <CodeBlock
          language="json"
          title="Chrome DevTools MCP (локальный npx)"
          code={`{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}`}
        />
      </Section>

      <Section title="Playwright MCP — полная автоматизация">
        <p>
          Если Chrome DevTools — это «посмотреть и проверить», то <strong>Playwright MCP</strong> — «сделать за
          пользователя»: кликнуть, заполнить форму, выбрать option, загрузить файл, прогнать сценарий.
        </p>
        <Tbl
          head={['Tool', 'Use-case']}
          rows={[
            ['browser_navigate', 'Перейти на sxodim.com, localhost, staging'],
            ['browser_click', 'Клик по кнопке «Купить билет» по ref из snapshot'],
            ['browser_type', 'Заполнить поле поиска «Алматы — Астана»'],
            ['browser_snapshot', 'Получить DOM для следующего шага'],
            ['browser_take_screenshot', 'Доказательство результата для отчёта'],
          ]}
        />
        <CodeBlock
          language="json"
          title="Playwright MCP"
          code={`{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}`}
        />
        <Callout type="info">
          <p>
            На семинаре агент открывает <strong>sxodim.com</strong>, ищет афишу и делает скриншот — типичный сценарий
            «исследователь + браузер». Playwright надёжнее DevTools для multi-step flows с формами.
          </p>
        </Callout>
      </Section>

      <Section title="Полный .mcp.json для модуля 4">
        <p>
          Объединим все серверы курса в один конфиг. Cursor читает его из корня проекта или{' '}
          <code>~/.cursor/mcp.json</code> (глобально).
        </p>
        <CodeBlock
          language="json"
          title=".mcp.json — Context7 + DevTools + Playwright + свой weather"
          code={`{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp"
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "weather": {
      "command": "python",
      "args": ["servers/weather_server.py"]
    },
    "notes": {
      "command": "python",
      "args": ["servers/notes_server.py"]
    }
  }
}`}
        />
        <p>
          После сохранения перезапусти Cursor или нажми «Refresh MCP» в настройках. Host выполнит{' '}
          <code>initialize</code> на каждом server и покажет список tools в панели MCP.
        </p>
      </Section>

      <ProjectNote>
        <p>
          Не подключай десять серверов «на всякий случай» — каждый tool попадает в контекст модели и съедает{' '}
          <Term id="token">токены</Term>. Для семинара хватит weather + playwright + notes; Context7 — когда пишешь код
          с незнакомой библиотекой.
        </p>
      </ProjectNote>

      <KeyIdea>
        Context7 — актуальная дока вместо training data. Chrome DevTools — смотреть и дебажить страницу. Playwright —
        автоматизировать действия. Всё подключается через .mcp.json; писать свой server нужно только для уникальной логики
        (weather, notes, 2GIS).
      </KeyIdea>
    </>
  )
}

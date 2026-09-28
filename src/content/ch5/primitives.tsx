import { Analogy, Callout, Fav, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { MCPPrimitivesPicker } from '../../components/interactive/MCPPrimitivesPicker'

export default function Lesson() {
  return (
    <>
      <Section title="Три примитива MCP">
        <p>
          Протокол намеренно минималистичен: всего три типа capabilities. Не пятнадцать эндпоинтов REST, не GraphQL-схема
          на сто типов — три примитива, которые покрывают 99% задач агента.
        </p>
        <Tbl
          head={['Примитив', 'Аналогия', 'Доля use-cases']}
          rows={[
            ['Tools', 'Руки агента: делает что-то и возвращает результат', '~95%'],
            ['Resources', 'Глаза: читает данные по URI', '~4%'],
            ['Prompts', 'Шаблоны: готовые инструкции с параметрами', '~1%'],
          ]}
        />
        <p>
          Ниже — интерактивная сортировка: выбери карточку и кликни на нужную колонку. Если сомневаешься — спроси себя: это
          <em> действие</em> (tool), <em>данные для чтения</em> (resource) или <em>шаблон текста</em> (prompt)?
        </p>
        <MCPPrimitivesPicker />
      </Section>

      <Section title="Tools — действия с аргументами">
        <p>
          <strong>Tools</strong> — главный примитив. Модель вызывает tool, передавая JSON-аргументы; server выполняет
          действие и возвращает результат. Side-effects разрешены: запись в БД, HTTP-запрос, скриншот браузера.
        </p>
        <CodeBlock
          language="python"
          title="Примеры tools"
          code={`# Погода — вызывает внешний API
get_weather(city: str) -> dict

# Браузер — side-effect: делает скриншот
browser_take_screenshot() -> image

# База — side-effect: INSERT
create_user(name: str, email: str) -> str  # returns user_id

# Поиск ресторанов
search_restaurants(query: str, lat: float, lon: float) -> list`}
        />
        <Callout type="tip">
          <p>
            Описание tool (docstring + type hints) автоматически превращается в JSON Schema — модель видит, какие
            аргументы обязательны. Пиши docstring как инструкцию для LLM: «Текущая погода в городе. Используй латинское
            название города.»
          </p>
        </Callout>
        <Callout type="tip">
          <p>
            <Fav /> Если сомневаешься, tool это или resource — выбирай tool. 95% задач агента — именно actions.
          </p>
        </Callout>
      </Section>

      <Section title="Resources — данные по URI">
        <p>
          <strong>Resources</strong> — read-only данные с URI-адресом. Host запрашивает ресурс по URI и получает контент:
          текст, JSON, бинарник. Никаких side-effects — только чтение.
        </p>
        <CodeBlock
          language="text"
          title="Примеры URI-ресурсов"
          code={`postgres://schema/users          → DDL таблицы users
context7://react/docs              → актуальная дока React
file://.mcp.json                   → конфиг MCP
notes://list                       → список сохранённых заметок
greetings://{name}                 → параметризованный ресурс`}
        />
        <Analogy>
          <p>
            Resource — как файл в файловой системе: у него есть путь (URI), его можно открыть и прочитать, но «открыть
            config.json» не меняет config.json. Tool — как команда <code>git commit</code>: выполняешь — мир изменился.
          </p>
        </Analogy>
        <p>
          Resources удобны для контекста, который меняется редко: схема БД, конфиг, документация. Host может подгружать
          их в <Term id="prompt">промпт</Term> до начала диалога, не дожидаясь tool call от модели.
        </p>
      </Section>

      <Section title="Prompts — шаблоны с параметрами">
        <p>
          <strong>Prompts</strong> — переиспользуемые шаблоны сообщений. Server хранит текст с плейсхолдерами; host
          запрашивает prompt с конкретными аргументами и получает готовое сообщение для LLM.
        </p>
        <CodeBlock
          language="python"
          title="Пример prompt в FastMCP"
          code={`@mcp.prompt
def code_review(language: str, code: str) -> str:
    """Шаблон code review для указанного языка."""
    return f"""Review this {language} code. Focus on:
1. Security issues
2. Performance
3. Readability

\`\`\`{language}
{code}
\`\`\`"""`}
        />
        <p>
          Prompts редки в community-серверах (~1% capabilities), но полезны для стандартизации: один и тот же шаблон
          code review или SQL explain во всех проектах команды.
        </p>
      </Section>

      <Section title="Когда что использовать">
        <Tbl
          head={['Задача', 'Примитив', 'Почему']}
          rows={[
            ['Узнать погоду в городе', 'Tool', 'Вызов API, результат зависит от аргумента'],
            ['Показать схему таблицы users', 'Resource', 'Статичные DDL-данные, только чтение'],
            ['Стандартный промпт для ревью PR', 'Prompt', 'Шаблон текста с параметрами'],
            ['Сохранить заметку на диск', 'Tool', 'Side-effect: запись файла'],
            ['Список всех заметок', 'Resource или Tool', 'Resource если read-only URI; tool если нужна фильтрация'],
            ['Сделать скриншот страницы', 'Tool', 'Действие в браузере'],
          ]}
        />
        <Callout type="info" title="Кто управляет примитивом">
          <p>
            По спецификации MCP tools — <strong>model-controlled</strong> (вызвать ли tool, решает модель), resources —{' '}
            <strong>application-driven</strong> (что подгрузить в контекст, решает host), prompts —{' '}
            <strong>user-controlled</strong> (пользователь выбирает шаблон, например slash-командой).
          </p>
        </Callout>
        <Callout type="info">
          <p>
            На практике большинство MCP-серверов экспортируют только tools. Resources добавляют, когда есть стабильные
            данные (конфиг, схема). Prompts — когда команда хочет единообразные инструкции без копипасты в system prompt.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В FastMCP-уроке ты напишешь все три примитива для weather-сервера: tool <code>get_weather</code>, resource{' '}
          <code>weather://cities</code> со списком поддерживаемых городов и prompt для сравнения погоды в двух городах.
        </p>
      </ProjectNote>

      <KeyIdea>
        Tools (~95%) — действия с аргументами и side-effects. Resources — read-only данные по URI. Prompts — шаблоны
        сообщений. Сомневаешься — делай tool. Три примитива покрывают весь арсенал агента.
      </KeyIdea>
    </>
  )
}

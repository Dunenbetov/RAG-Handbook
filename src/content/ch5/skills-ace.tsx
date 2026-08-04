import { Analogy, Callout, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="MCP даёт руки — но не мозг">
        <p>
          Подключил weather, Playwright и notes — у агента появилось 15 tools. Спроси «спланируй вечер» — и модель может
          вызвать не те tools, в неправильном порядке, или вообще ответить текстом без действий. MCP решает{' '}
          <em>подключение</em>, но не <em>поведение</em>.
        </p>
        <p>
          Здесь на сцену выходят <strong>Skills</strong> — markdown-файлы с правилами поведения агента. Это не код и не
          tools: это инструкции «когда и как использовать capabilities».
        </p>
      </Section>

      <Section title="Skills = markdown behavior rules">
        <p>
          Skill — файл <code>SKILL.md</code> в папке <code>.cursor/skills/</code> (или аналог в других IDE). Внутри:
          описание задачи, пошаговый workflow, ограничения, примеры хороших и плохих ответов.
        </p>
        <CodeBlock
          language="markdown"
          title="Пример: weather-planner/SKILL.md"
          code={`# Weather Planner Skill

## When to activate
User asks about weather, trip planning, or "what to wear".

## Workflow
1. Always call get_weather with Latin city names
2. If comparing cities — call get_weather twice, then summarize
3. Never guess temperature — only use tool results
4. If city not found — suggest checking spelling or pick from weather://cities resource

## Output format
- Temperature in °C
- One-line recommendation (umbrella, jacket, etc.)`}
        />
        <Analogy>
          <p>
            MCP tools — инструменты в ящике мастера. Skills — чертежи и чек-листы на стене: «сначала замерь, потом режь,
            не используй болгарку для шурупов». Без чертежей мастер знает, что болгарка есть, но может применить её не к
            тому.
          </p>
        </Analogy>
      </Section>

      <Section title="Формула: MCP + Skills">
        <Tbl
          head={['Слой', 'Что даёт', 'Аналогия']}
          rows={[
            ['MCP Servers', 'Capabilities: tools, resources, prompts', 'API, драйверы, плагины'],
            ['Skills', 'Когда и как вызывать capabilities', 'Runbook, SOP, playbooks'],
            ['System prompt', 'Базовая личность и границы', 'Должностная инструкция'],
            ['LLM', 'Рассуждение и синтез ответа', 'Сотрудник за столом'],
          ]}
        />
        <p>
          Хороший агент = минимальный system prompt + точные skills под задачу + релевантные MCP-серверы. Плохой агент =
          гигантский system prompt на три страницы «на всякий случай» и 20 подключённых servers.
        </p>
        <Callout type="tip">
          <p>
            В Cursor skills подхватываются автоматически, когда запрос пользователя совпадает с описанием skill. Не нужно
            @-упоминать — агент читает SKILL.md и следует workflow.
          </p>
        </Callout>
      </Section>

      <Section title="ACE — Agent Context Engineering">
        <p>
          <strong>ACE</strong> (Agent Context Engineering) — подход к сборке контекста агента: что положить в окно модели,
          в каком порядке и с каким приоритетом. Три столпа:
        </p>
        <ul>
          <li>
            <strong>Tools</strong> (MCP) — только нужные для задачи; лишние tools шумят и путают модель.
          </li>
          <li>
            <strong>Skills</strong> — процедурная память: пошаговые сценарии вместо длинных system prompts.
          </li>
          <li>
            <strong>Resources</strong> — статичный контекст (схема БД, конфиг, глоссарий) подгружается до диалога, не
            через tool call.
          </li>
        </ul>
        <p>
          ACE — это ответ на «context rot»: чем длиннее промпт, тем хуже модель следует инструкциям в середине. Skills
          разбивают инструкции на маленькие файлы, которые активируются по необходимости — контекст остаётся компактным.
        </p>
      </Section>

      <Section title="OpenClaw и ClawHub — skills marketplace">
        <p>
          Экосystem skills растёт так же, как MCP servers. <strong>OpenClaw</strong> — open-source фреймворк для
          персональных агентов с plugin-архитектурой. <strong>ClawHub</strong> — маркетплейс готовых skills и
          extensions: от «deploy to Vercel» до «review PR like a senior».
        </p>
        <p>
          Идея та же, что у MCP registry: не писать всё с нуля, а брать проверенный skill и адаптировать под проект.
          Cursor идёт в том же направлении — community skills в{' '}
          <code>.cursor/skills-cursor/</code> и пользовательские в <code>.cursor/skills/</code>.
        </p>
        <Callout type="info">
          <p>
            Для Project 5 напиши skill для planner-агента: workflow «погода → браузер → заметка» с явным порядком tool
            calls. Это +10 баллов к качеству агента без единой строки нового Python.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Сравни два подхода на одном запросе «Узнай погоду в Алматы, найди концерт на sxodim.com и сохрани план в
          заметку». Без skill модель может пропустить шаг или сохранить заметку до получения погоды. С skill «planner» —
          следует чек-листу из трёх tools в правильном порядке.
        </p>
      </ProjectNote>

      <KeyIdea>
        MCP = capabilities. Skills = behavior rules в markdown. ACE = осознанная сборка контекста (tools + skills +
        resources). Формула сильного агента: мало servers, точные skills, короткий system prompt.
      </KeyIdea>
    </>
  )
}

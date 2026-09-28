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
          Skill — <strong>папка</strong> с обязательным файлом <code>SKILL.md</code>, например{' '}
          <code>.cursor/skills/weather-planner/</code> (или аналог в других IDE: <code>.claude/skills/</code>). В начале
          файла YAML-frontmatter с двумя обязательными полями: <code>name</code> и <code>description</code>. Ниже —
          markdown-тело: пошаговый workflow, ограничения, формат ответа, примеры. Рядом могут лежать папки{' '}
          <code>references/</code> (справочники), <code>scripts/</code> и <code>assets/</code>.
        </p>
        <CodeBlock
          language="markdown"
          title="Пример: weather-planner/SKILL.md"
          code={`---
name: weather-planner
description: >
  Plans outings around the weather. Use when the user asks about weather,
  trip planning or "what to wear". Do not use for historical climate data.
---

# Weather Planner Skill

## Workflow
1. Always call get_weather with Latin city names
2. If comparing cities — call get_weather twice, then summarize
3. Never guess temperature — only use tool results
4. If city not found — suggest checking spelling or pick from weather://cities resource

## Output format
- Temperature in °C
- One-line recommendation (umbrella, jacket, etc.)
- For "what to wear" questions, read references/clothing.md first`}
        />
        <Analogy>
          <p>
            MCP tools — инструменты в ящике мастера. Skills — чертежи и чек-листы на стене: «сначала замерь, потом режь,
            не используй болгарку для шурупов». Без чертежей мастер знает, что болгарка есть, но может применить её не к
            тому.
          </p>
        </Analogy>
        <p>
          Главное в frontmatter — <code>description</code>. По нему агент решает, подгружать ли skill: это и есть
          «триггер». Поэтому в description пишут и что skill делает, и когда его использовать (а лучше и когда не
          использовать), а не прячут это в тело. Дальше работает <strong>progressive disclosure</strong>, загрузка по
          уровням:
        </p>
        <Tbl
          head={['Уровень', 'Что попадает в контекст', 'Когда']}
          rows={[
            ['1. Метаданные', 'name + description из frontmatter, порядка 100 слов', 'Всегда, для всех подключённых skills'],
            ['2. Тело SKILL.md', 'Workflow, запреты, формат ответа', 'Когда агент по description решил, что skill подходит к задаче'],
            ['3. Файлы рядом', 'references/, scripts/, assets/', 'Только когда тело SKILL.md на них ссылается и задача этого требует; скрипты можно запускать, не читая'],
          ]}
        />
        <p>
          Отсюда правило: файл из <code>references/</code>, на который тело SKILL.md не ссылается, агент, скорее всего,
          так и не откроет. Ссылку пиши вместе с условием: «для вопросов что надеть — прочитай references/clothing.md».
        </p>
        <Callout type="tip" title="Вопрос на защите">
          <p>
            <strong>«Чем Skill лучше промпта?»</strong> Честный ответ: Skill — это тоже промпт, только упакованный в папку и
            загружаемый по уровням.
          </p>
          <ul>
            <li>
              <strong>Контекст.</strong> В окне постоянно лежат только name и description. Тело попадает туда, когда задача
              совпала с description, справочники — ещё позже. Длинный системный промпт оплачивается токенами и вниманием
              модели в каждом вызове, даже когда его правила не нужны.
            </li>
            <li>
              <strong>Явный триггер.</strong> description говорит, когда skill применять и когда нет, поэтому десятки skills
              уживаются рядом, не раздувая промпт.
            </li>
            <li>
              <strong>Модульность.</strong> Папку версионируют и ревьюят отдельно, один и тот же skill работает в Claude
              Code, Cursor и других агентах, рядом можно положить скрипты и справочники.
            </li>
          </ul>
          <p>
            Слабое место финального проекта remark-round. В продукте текст SKILL.md (без frontmatter) целиком вклеивается
            в системный промпт всех вызовов модели, кроме переформулировки запроса (<code>apps/api/src/llm/skill.ts</code>).
            Ни триггера, ни progressive disclosure там нет: это системный промпт, который хранится в файле. Механика skill
            работает, только когда тот же SKILL.md подключён агенту (Claude Code через <code>.claude-plugin</code>). А
            папка <code>references/</code> (classes.md, examples.md, tools.md) в теле SKILL.md не упомянута, так что
            третий уровень не срабатывает и у агента.
          </p>
          <p>
            Как исправить: (1) сослаться из тела SKILL.md на каждый файл с условием: «сомневаешься между дефектом и CR —
            прочитай references/classes.md», «нужен образец разбора — references/examples.md», «какой MCP-tool когда
            вызывать — references/tools.md»; (2) на защите честно назвать роль SKILL.md в продукте: единый источник правил
            для агента и для графа; (3) если нужна экономия и в продукте, подмешивать в каждую ноду только её часть
            правил (например, classes.md — только в classify), а не весь текст во все вызовы.
          </p>
        </Callout>
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
          Экосистема skills растёт так же, как MCP servers. <strong>OpenClaw</strong> — open-source фреймворк для
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

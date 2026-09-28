import { Link } from 'react-router-dom'
import { Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="ТЗ семинара за минуту">
        <p>
          Легенда: ИИ-профайлер собирает досье на человека по открытым данным. Мешают однофамильцы и защита от скрапинга.
          Агент должен разбирать свои ошибки поиска и дописывать себе «плейбук» правил. Инструменты:{' '}
          <strong>Exa</strong> (семантический поиск со сниппетами), <strong>Jina Reader</strong> (URL → Markdown в обход
          защиты), <strong>Vector DB manager</strong> (<code>query_profile</code> / <code>upsert_profile</code> с
          разрешением конфликтов фактов).
        </p>
        <CodeBlock
          language="python"
          title="Обязательный State и поток"
          code={`class AgentState(TypedDict):
    target_person: str
    playbook: List[str]
    insights: str
    messages: Annotated[list, add_messages]
    iterations: int

# START → generator → rag_upsert → reflector
#   ├─ недостаточно → curator → generator
#   └─ достаточно или iterations >= лимит → END`}
        />
        <p>
          Критерий приёмки — тест на распространённом имени с узкой специальностью и печать{' '}
          <code>state["playbook"]</code> на каждой итерации: видно, как правила эволюционируют.
        </p>
      </Section>

      <Section title="ACE: контекст как развивающийся плейбук">
        <p>
          <strong>ACE — Agentic Context Engineering</strong> (arXiv 2510.04618, Stanford / SambaNova / UC Berkeley).
          Идея: улучшать не веса, а <strong>контекст</strong> — system prompt или память агента. Контекст — это плейбук
          из пунктов-правил, над которым работают три роли:
        </p>
        <Steps
          items={[
            { title: 'Generator', body: 'Решает задачу, опираясь на текущий плейбук, и оставляет траекторию: что делал, что сработало, что нет.' },
            { title: 'Reflector', body: 'Разбирает траекторию и формулирует уроки: почему ошиблись, какая стратегия помогла бы.' },
            { title: 'Curator', body: 'Превращает уроки в компактную дельту: новые пункты, правки существующих. Вливает её в плейбук лёгкий детерминированный код без LLM, плейбук целиком не переписывается.' },
          ]}
        />
        <p>ACE лечит две болезни прежних оптимизаторов промптов:</p>
        <ul>
          <li><strong>Brevity bias</strong> — оптимизатор сжимает контекст в короткую сводку и теряет доменные детали.</li>
          <li><strong>Context collapse</strong> — при переписывании всего контекста на каждой итерации детали постепенно стираются, контекст схлопывается, точность падает.</li>
        </ul>
        <p>
          Ответ ACE — <strong>инкрементальные delta-обновления</strong> по принципу grow-and-refine: плейбук растёт
          пунктами, дубли периодически вычищаются. Режимы: <strong>offline</strong> (оптимизировать system prompt на
          обучающих задачах) и <strong>online</strong> (память агента прямо во время работы). По абстракту статьи: +10,6%
          на агентских задачах и +8,6% на финансовых, ниже задержка и стоимость адаптации, размеченные данные не нужны —
          хватает обратной связи от исполнения.
        </p>
        <Callout type="warn" title="Уточнение к главе 5">
          <p>
            В <Link to="/ch5/skills-ace" className="text-accent hover:underline">уроке про Skills</Link> ACE описан широко,
            как «сборка контекста агента». В статье это конкретный фреймворк с тремя ролями и дельта-обновлениями, а
            расшифровка — <em>Agentic</em> Context Engineering.
          </p>
        </Callout>
      </Section>

      <Section title="Reflection, ACE и RAG — в чём разница">
        <Tbl
          head={['', 'Self-reflection', 'ACE', 'RAG']}
          rows={[
            ['Что улучшает', 'Текущий ответ', 'Стратегии агента на будущие задачи', 'Фактическую опору ответа'],
            ['Что хранит', 'Ничего, кроме черновиков', 'Плейбук правил (как действовать)', 'Корпус фактов (что известно)'],
            ['Время жизни', 'Один запрос', 'Переживает задачи', 'Пока жив корпус'],
            ['Пример', 'Критик вернул черновик на доработку', '«Добавляй профессию в запрос по однофамильцам»', 'Найти раздел ТЗ по замечанию'],
          ]}
        />
        <p>
          Коротко: reflection чинит этот ответ, ACE копит переиспользуемые инструкции, <Term id="rag">RAG</Term>{' '}
          достаёт факты. Их можно комбинировать: Reflector в ACE — это тот же evaluator, только его вывод идёт в
          плейбук, а не в переделку черновика.
        </p>
      </Section>

      <Section title="Разбор эталонного решения: что бы я улучшил">
        <p>
          <code>ace_osint_agent.py</code>: <code>MAX_ITER=3</code>, <code>recursion_limit=50</code>, Chroma
          EphemeralClient, досье — один документ с id = md5(имени). Generator делает три вызова LLM (запросы в Exa → выбор
          URL для Jina → сводка фактов), Reflector возвращает <code>sufficient | insufficient</code>, Curator —{' '}
          <code>{'{"add": [...], "remove": [...]}'}</code>, и плейбук = старый − remove + add. Рабочая основа, но на защите
          семинара пригодится список улучшений:
        </p>
        <ul>
          <li><strong>Это workflow, а не tool-calling агент.</strong> Tools обёрнуты в <code>@tool</code>, но к LLM не привязаны: узлы зовут их напрямую. Допустимо — но надо уметь так и назвать.</li>
          <li><strong>Reflector видит только досье</strong>, а не траекторию (запросы, выбранные и отброшенные URL). Диагноз «нашли не того Ивана Иванова» из примера ТЗ он поставить не может. В ACE Reflector смотрит именно траекторию.</li>
          <li><strong>Нет разрешения конфликтов</strong>: два разных места работы просто лежат рядом, хотя ТЗ этого требует.</li>
          <li><strong>Векторная БД как key-value</strong>: чтение по id, семантического поиска нет — «RAG» только в названии.</li>
          <li><strong>Эфемерный плейбук</strong>: живёт в памяти одного запуска, а суть ACE — правила, переживающие задачи. Нужен persistent-стор.</li>
          <li><strong>Нет счётчиков полезности и дедупликации правил</strong>; Curator — LLM, хотя дельту можно вливать детерминированным кодом.</li>
          <li><strong>JSON через <code>{'raw.find("{")'}</code></strong> — хрупко. Надёжнее <code>with_structured_output(PydanticModel)</code> или strict JSON Schema (<Link to="/ch10/structured-output" className="text-accent hover:underline">урок про structured output</Link>).</li>
        </ul>
        <Callout type="tip" title="Вопрос на защите: почему инструменты вызываются кодом, а не через bind_tools?">
          <p>
            «Порядок "поиск → чтение → сохранение" известен заранее, и выбор инструмента моделью ничего не даёт, зато
            добавляет недетерминизм и цену. LLM решает то, что код не может: какие запросы строить, какие URL — наш
            человек, что за урок из итерации. По Anthropic это workflow с prompt chaining и evaluator-optimizer».
          </p>
        </Callout>
      </Section>

      <Section title="Мультиагентность: роли ≠ агенты">
        <p>
          Лекция называет мультиагентностью «разные промпты и модели в узлах». Точнее это <strong>мультиролевой
          workflow</strong>: Generator, Reflector и Curator делят один State и один заданный кодом маршрут. Настоящая
          мультиагентная система — это агенты с <strong>собственным контекстом, своими tools и передачей
          управления</strong> (handoff): supervisor, иерархия, swarm, в LangGraph — подграфы и{' '}
          <code>Command(goto=..., graph=Command.PARENT)</code>. Когда это оправдано и почему чаще не нужно — в{' '}
          <Link to="/ch10/multi-agent-a2a" className="text-accent hover:underline">уроке про мультиагентов и A2A</Link>.
        </p>
      </Section>

      <ProjectNote>
        <p>
          В remark-round плейбук — это <code>skills/uat-triage/SKILL.md</code>: процедура из 9 шагов и 3 запрета, тот же
          текст подмешивается в системный промпт через <code>apps/api/src/llm/skill.ts</code>. Он эволюционирует
          <strong> вручную, offline</strong>: правка → прогон golden → решение (classify v1 22/30 → сейчас 27/30). Если
          спросят про ACE, честный ответ: «ACE автоматизировал бы этот цикл. Сигнал для Reflector уже есть — кнопка PM "Не та
          цитата". Но без отложенной выборки Curator переобучился бы на тех же 49 кейсах golden, поэтому пока роль
          куратора ручная».
        </p>
      </ProjectNote>

      <KeyIdea>
        ACE — это Generator → Reflector → Curator над плейбуком, который растёт дельтами и не переписывается целиком
        (против brevity bias и context collapse). Reflection чинит ответ, ACE копит стратегии, RAG достаёт факты.
        Эталонный OSINT-агент — мультиролевой workflow; главные улучшения — траектория для Reflector, персистентный
        плейбук и structured output.
      </KeyIdea>
    </>
  )
}

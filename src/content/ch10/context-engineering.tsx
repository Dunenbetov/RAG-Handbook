import { Link } from 'react-router-dom'
import { Callout, KeyIdea, ProjectNote, Section, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'

export default function Lesson() {
  return (
    <>
      <Section title="Что такое context engineering">
        <p>
          <Term id="context-engineering">Context engineering</Term> — это решение о том, <strong>что именно</strong> попадёт в{' '}
          <Term id="context-window">окно контекста</Term> модели на каждом шаге. Karpathy описывает это как «filling the context
          window with just the right information for the next step».
        </p>
        <p>
          В окне на каждом шаге лежат: системный промпт, схемы tools, история, RAG-чанки, scratchpad, долгая память, результаты
          tools, few-shot примеры и ответы саб-агентов. Каждый лишний токен стоит денег, отнимает внимание модели у нужных фактов
          и прибавляет задержку.
        </p>
        <Callout type="info" title="Главный сдвиг мышления">
          <p>
            Правильный вопрос — «какой контекст нужен задаче на этом шаге», а не «какую LLM взять». Промпт-инжиниринг занимается
            формулировкой одной инструкции. Context engineering собирает всё окно из многих источников.
          </p>
        </Callout>
        <p>
          Связка со Skills и ACE разобрана в{' '}
          <Link to="/ch5/skills-ace" className="text-accent hover:underline">
            уроке главы 5
          </Link>
          . Здесь — стратегии, память и то, как всё это выглядит в remark-round.
        </p>
      </Section>

      <Section title="Четыре стратегии: Write, Select, Compress, Isolate">
        <p>Классификация из блога LangChain (2025). Отвечая на вопрос про контекст, называй стратегию и её реализацию в своём коде.</p>
        <Tbl
          head={['Стратегия', 'Суть', 'Типичный пример', 'В remark-round']}
          rows={[
            ['Write', 'Записать вне окна, достать позже', 'scratchpad, CLAUDE.md, state', 'TriageState и чекпоинты в Postgres: на паузе HITL история не висит в промпте'],
            ['Select', 'Подтянуть только нужное', 'RAG, поиск по памяти, выбор tools', <><code>retrieve_docs</code>: top-6 по косинусу с фильтром <code>projectId</code> прямо в SQL</>],
            ['Compress', 'Сжать то, что разрастается', 'суммаризация, auto-compact, обрезка вывода tools', <>жёсткие <code>max_tokens</code> (vision 160, rewrite 60, classify 300, draft 220) и <code>clip()</code> полей промпта</>],
            ['Isolate', 'У каждого исполнителя своё окно', 'саб-агенты, отдельные ноды', 'нода берёт из State только свои поля: vision сводит кадр к коротким текстовым фактам, дальше по графу идут факты'],
          ]}
        />
        <Callout type="warn" title="Слабое место: Compress без замера">
          <p>
            Лимит rewrite в 60 токенов на проде обрезает запрос в 4 вызовах из 5, и этот параметр не варьировали. Если спросят —
            признай и назови план: прогнать golden с 60 / 120 и смотреть hit@k.
          </p>
        </Callout>
      </Section>

      <Section title="Пять типов памяти">
        <Tbl
          head={['Тип', 'Аналогия', 'Реализация', 'В remark-round']}
          rows={[
            ['In-context', 'RAM', 'текущее окно', 'промпт classify: факты замечания + найденные чанки'],
            ['Scratchpad', 'диск на время сессии', 'state в LangGraph', <>TriageState, чекпоинт по <code>thread_id = runId</code></>],
            ['Episodic', 'воспоминания', 'Reflexion: выводы из прошлых попыток', 'в рамках прогона: «прошлый черновик отклонён проверкой…» уходит в повторный промпт'],
            ['Semantic', 'база знаний', 'Mem0, Letta memory blocks, векторная БД', 'ТЗ и протоколы в pgvector (DocumentChunk)'],
            ['Procedural', 'инструкции', 'CLAUDE.md, системный промпт', <>текст <code>SKILL.md</code> подмешивается в системный промпт</>],
          ]}
        />
      </Section>

      <Section title="Context rot: почему длинный контекст портит ответы">
        <p>
          <Term id="context-rot">Context rot</Term> — качество падает по мере роста контекста, хотя окно ещё не заполнено. Три механизма:
        </p>
        <ul>
          <li>
            <strong>Lost in the middle</strong> (Liu et al., 2023). Точность от позиции нужного факта — U-образная кривая: начало и
            конец модель использует лучше середины.
          </li>
          <li>
            <strong>Attention dilution.</strong> Веса внимания нормированы softmax, поэтому с ростом числа токенов каждому
            достаётся меньше. Это интуиция, а не строгий закон, но шумные чанки реально мешают.
          </li>
          <li>
            <strong>Распространение галлюцинаций.</strong> Выдумка попадает в scratchpad, а на следующих шагах агент принимает её за
            факт.
          </li>
        </ul>
        <p>
          Тактики: важное ставить в начало или в конец, мало, но точных чанков (для этого{' '}
          <Link to="/ch2/reranking" className="text-accent hover:underline">
            reranking
          </Link>
          ), вычищать длинные выводы tools, сжимать историю, проверять факты отдельным шагом (critic или проверка кодом).
        </p>
        <Callout type="warn" title="Неточность в лекции">
          <p>
            «Lost in the middle теряет ~30%+ точности» — в работе нет такой универсальной цифры: просадка зависит от модели и задачи.
            Говори «U-образная кривая, середина хуже краёв». Цитату Gartner из лекции как факт не приводи: источник не проверен.
          </p>
        </Callout>
      </Section>

      <Section title="Long context или RAG">
        <VS
          left={{
            title: 'Всё ТЗ в контекст',
            tone: 'neutral',
            children: <p>Проще, нет промахов retrieval. Но цена растёт с каждым документом, срабатывает lost in the middle, цитату нельзя проверить по разделу.</p>,
          }}
          right={{
            title: 'Retrieval top-k',
            tone: 'good',
            children: <p>Дешевле и растёт медленно, опора — конкретный раздел, score близости служит сигналом «опоры нет». Зато возможен промах поиска.</p>,
          }}
        />
        <Callout type="tip" title="Вопрос на защите">
          <p>
            <em>«Почему не отдать всё ТЗ в контекст, раз там 11 чанков?»</em> — По нашей оценке полный контекст в classify стоит
            около $0,005–0,006 против $0,0009 сейчас, и цена растёт с каждым протоколом. Цитата на конкретный раздел проверяема: на
            ней стоят структурная проверка опоры и кнопка «Не та цитата». Порог близости управляет переписыванием запроса — без
            retrieval этого сигнала нет. Честно: на ТЗ в 4 тыс. слов long context был бы проще, его качество мы не мерили.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Select: <code>RETRIEVE_K = 6</code> в <code>apps/api/src/agent/triage.graph.ts</code>, после переписываний выдачи
          сливаются и держат до 8 лучших. Compress: <code>maxTokens</code> в <code>apps/api/src/llm/llm-params.ts</code> и{' '}
          <code>clip()</code> с лимитами символов в <code>apps/api/src/llm/openai-triage-llm.ts</code>. Write:{' '}
          <code>graph-state.ts</code> и <code>prisma-checkpointer.ts</code>. На защите пройди эти четыре стратегии по файлам.
        </p>
      </ProjectNote>

      <KeyIdea>
        Context engineering — это управление окном: Write выносит состояние наружу, Select подтягивает нужное, Compress режет
        лишнее, Isolate разводит окна. Чем длиннее контекст, тем хуже модель находит нужное, поэтому 6 точных чанков часто
        лучше, чем весь документ.
      </KeyIdea>
    </>
  )
}

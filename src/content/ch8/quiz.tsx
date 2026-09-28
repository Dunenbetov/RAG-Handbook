import { Section } from '../../components/ui'
import { QuizBlock } from '../../components/QuizBlock'

const questions = [
  {
    q: 'Ментор: «Где в remark-round агент?» Какой ответ точнее всего по таксономии Anthropic?',
    options: [
      'Весь граф triage — агент, потому что он построен на LangGraph и в нём есть циклы',
      'Агент — нода classify_evidence, потому что там LLM выбирает класс',
      'Граф triage — детерминированный workflow (routing + evaluator-optimizer + HITL); агентная часть с tool-calling — Claude Code через MCP',
      'Агента нет и не нужно, ТЗ требует только RAG',
    ],
    answer: 2,
    explain:
      'Workflow — пути заданы кодом, agent — LLM сама ведёт цикл и выбирает tools. В triage модель влияет на маршрут только выходами (score, проверка), человек — кнопкой. LangGraph сам по себе ничего не говорит об автономности. Tool-calling агент — Claude Code, который сам решает, когда звать search_spec.',
  },
  {
    q: 'State: status: str (без reducer). Два узла из одного супершага (fan-out) оба вернули status. Что произойдёт?',
    options: [
      'InvalidUpdateError: параллельная запись в ключ без reducer',
      'Победит узел, который закончил последним',
      'Значения склеятся в список',
      'LangGraph молча оставит старое значение',
    ],
    answer: 0,
    explain:
      'Без reducer ключ работает как last-write-wins, но внутри одного супершага «последнего» нет. LangGraph бросает InvalidUpdateError. Reducer (operator.add, свой merge) нужен для любого ключа, в который пишут параллельно, а не только для messages.',
  },
  {
    q: 'В messages (reducer add_messages) уже есть AIMessage с id="a1". Узел возвращает {"messages": [AIMessage("новый текст", id="a1")]}. Результат?',
    options: [
      'В списке станет два сообщения с id="a1"',
      'Ошибка дубликата id',
      'Сообщение добавится в начало списка',
      'Старое сообщение заменится новым — add_messages мержит по id',
    ],
    answer: 3,
    explain:
      'add_messages не «просто дописывает»: сообщения с новым id добавляются, с существующим — заменяют старое. Удаление — через RemoveMessage(id=...). Так правят и чистят историю.',
  },
  {
    q: 'Нода: send_email(draft); decision = interrupt({...}). Что случится после invoke(Command(resume="ok"), config)?',
    options: [
      'Нода продолжит со строки после interrupt, письмо уйдёт один раз',
      'Нода выполнится с начала: send_email сработает второй раз',
      'Граф начнёт весь прогон с START',
      'resume проигнорируется без interrupt_before',
    ],
    answer: 1,
    explain:
      'При resume нода с interrupt() перезапускается с первой строки, и только interrupt() теперь сразу возвращает resume-значение. Побочные эффекты до interrupt должны быть идемпотентными или жить в отдельной ноде перед HITL — как propose перед hitl в remark-round.',
  },
  {
    q: 'Критик возвращает JSON со score. Парсинг упал. Какое поведение правильное?',
    options: [
      'Поставить score=8 и пропустить ответ, чтобы не блокировать пользователя',
      'Повторять вызов критика, пока JSON не распарсится',
      'Считать проверку не пройденной (fail-closed): на переделку, а после N итераций — человеку',
      'Удалить критика из графа',
    ],
    answer: 2,
    explain:
      'score=8 при ошибке (как в agent_advanced.py) — fail-open: сломанный критик пропускает любой ответ. Fail-closed плюс лимит итераций в State. А structured output (with_structured_output, strict JSON Schema) убирает сам класс ошибок парсинга.',
  },
  {
    q: 'Какой способ паузы документация LangGraph рекомендует для human-in-the-loop?',
    options: [
      'compile(interrupt_before=[...]) и продолжение invoke(None, config)',
      'Новый thread_id на каждое сообщение пользователя',
      'input() прямо внутри ноды',
      'interrupt(payload) внутри ноды и продолжение invoke(Command(resume=...)) с тем же thread_id',
    ],
    answer: 3,
    explain:
      'Статические interrupt_before/after — инструмент отладки. Для HITL — динамический interrupt(): payload уходит наружу, значение из Command(resume) становится его результатом. Checkpointer и тот же thread_id обязательны. Несколько пауз подряд вызывающий код обрабатывает циклом while.',
  },
  {
    q: 'Модель вернула три параллельных tool_calls, узел исполнил только tool_calls[0]. Что будет на следующем вызове OpenAI?',
    options: [
      'Ошибка 400: на каждый tool_call нужен ToolMessage с совпадающим tool_call_id',
      'Модель сама повторит пропущенные вызовы',
      'Ничего: лишние tool_calls игнорируются',
      'GraphRecursionError',
    ],
    answer: 0,
    explain:
      'API требует ответ на каждый tool_call. Это баг showcase-скрипта семинара. ToolNode из langgraph.prebuilt исполняет все вызовы сам и возвращает ToolMessage на каждый.',
  },
  {
    q: 'Чем ACE отличается от self-reflection и RAG?',
    options: [
      'ACE дообучает веса модели на ошибках, reflection и RAG — нет',
      'Reflection чинит текущий ответ, ACE копит переиспользуемые стратегии в плейбуке дельтами, RAG достаёт факты',
      'ACE — это RAG, где в векторной БД лежат промпты',
      'ACE переписывает весь system prompt после каждой задачи',
    ],
    answer: 1,
    explain:
      'ACE (Generator → Reflector → Curator) адаптирует контекст, а не веса. Curator готовит инкрементальные дельты, и их вливают в плейбук, а не переписывают его целиком, — именно это спасает от brevity bias и context collapse. RAG отвечает на «что известно», ACE — на «как действовать».',
  },
]

export default function Lesson() {
  return (
    <Section title="Квиз: LangGraph">
      <p>
        Восемь вопросов по главе: workflow против агента, reducers, ловушка resume, fail-closed критик, tool calling и
        ACE. Отвечай так, как ответил бы ментору на защите.
      </p>
      <QuizBlock id="ch8" questions={questions} />
    </Section>
  )
}

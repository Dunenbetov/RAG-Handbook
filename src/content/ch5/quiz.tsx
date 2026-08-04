import { Section } from '../../components/ui'
import { QuizBlock } from '../../components/QuizBlock'

const questions = [
  {
    q: 'Какую проблему MCP решает по сравнению с N×M интеграциями?',
    options: [
      'LLM перестают галлюцинировать',
      'Один MCP-сервер подключается ко всем MCP-хостам — достаточно M+N интеграций вместо M×N',
      'MCP заменяет необходимость в JSON Schema',
      'MCP ускоряет inference модели',
    ],
    answer: 1,
    explain:
      'MCP стандартизирует «разъём» между host и server. Написал weather-сервер один раз — он работает в Cursor, Claude Desktop и любом MCP-хосте. Без MCP каждая пара platform↔tool — отдельная интеграция.',
  },
  {
    q: 'Сколько MCP Client-соединений создаёт host при подключении трёх MCP-серверов?',
    options: [
      'Один client на все серверы',
      'Три client — по одному на каждый server (правило 1:1)',
      'Шесть — по два на server',
      'Client не нужен, host общается с server напрямую',
    ],
    answer: 1,
    explain:
      'Правило 1:1: один MCP Client = одна сессия с одним MCP Server. Три сервера → три независимых client. Это даёт изоляцию и параллельные tool calls.',
  },
  {
    q: 'Какой transport использует локальный FastMCP-сервер при mcp.run() по умолчанию?',
    options: [
      'WebSocket',
      'gRPC',
      'STDIO (stdin/stdout JSON-RPC)',
      'REST HTTP на порту 8080',
    ],
    answer: 2,
    explain:
      'mcp.run() без аргументов поднимает STDIO: host запускает server как дочерний процесс и обменивается JSON-RPC через stdin/stdout. HTTP нужен для remote servers (Context7, Figma).',
  },
  {
    q: 'Какой примитив MCP покрывает ~95% use-cases агента?',
    options: ['Resources', 'Prompts', 'Tools', 'Subscriptions'],
    answer: 2,
    explain:
      'Tools — действия с аргументами и side-effects: API-вызовы, запись файлов, скриншоты. Resources — read-only данные (~4%), Prompts — шаблоны (~1%).',
  },
  {
    q: 'Чем Resource отличается от Tool?',
    options: [
      'Resource быстрее выполняется',
      'Resource — read-only данные по URI без side-effects; Tool — действие, которое что-то меняет или вызывает API',
      'Resource доступен только удалённым серверам',
      'Resource не использует JSON Schema',
    ],
    answer: 1,
    explain:
      'Resource — как файл: открыл postgres://schema/users, прочитал DDL. Tool — как команда: get_weather(city) сходит в API и вернёт результат. Side-effects = tool.',
  },
  {
    q: 'Что происходит после того, как LLM вернула tool_call?',
    options: [
      'Server сразу отправляет ответ пользователю',
      'Host передаёт tools/call через Client на Server, получает tool_result и отправляет его обратно LLM для финального ответа',
      'LLM сама выполняет HTTP-запрос к API',
      'Client генерирует новый промпт без участия server',
    ],
    answer: 1,
    explain:
      'LLM только генерирует JSON tool_call. Host → Client → Server выполняют tools/call. Результат (tool_result) возвращается модели, и она формулирует человекочитаемый ответ. Модель никогда не ходит в API напрямую.',
  },
]

export default function Lesson() {
  return (
    <Section title="Квиз: MCP">
      <p>
        Шесть вопросов по архитектуре, примитивам и транспорту — проверь, что протокол сложился в голове перед семинаром и
        Project 5.
      </p>
      <QuizBlock id="ch5" questions={questions} />
    </Section>
  )
}

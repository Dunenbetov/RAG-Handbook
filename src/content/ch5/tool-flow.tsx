import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps } from '../../components/ui'
import { CodeBlock } from '../../components/CodeBlock'
import { MCPToolCallFlow } from '../../components/interactive/MCPToolCallFlow'

export default function Lesson() {
  return (
    <>
      <Section title="От вопроса до ответа — семь шагов">
        <p>
          Когда пользователь спрашивает «Какая погода в Алматы?», за красивым ответом стоит цепочка из семи участников.
          Ниже — интерактивная анимация: нажимай Play или листай шаги, чтобы увидеть, кто кому что передаёт.
        </p>
        <MCPToolCallFlow />
      </Section>

      <Section title="Разбор каждого этапа">
        <Steps
          items={[
            {
              title: '1. User → Host',
              body: 'Пользователь отправляет сообщение. Host (Cursor, Claude Desktop) получает текст и добавляет его в историю диалога вместе с system prompt.',
            },
            {
              title: '2. Host собирает tools',
              body: 'Перед вызовом LLM host опрашивает все MCP Clients: tools/list на каждом server. Получает объединённый список tools с JSON Schema — и передаёт его модели как «доступные функции».',
            },
            {
              title: '3. LLM решает вызвать tool',
              body: 'Модель анализирует вопрос и список tools. Вместо текста возвращает structured output: tool_call с именем get_weather и arguments { city: "Almaty" }. Это тот же Function Calling, что ты видел в OpenAI API.',
            },
            {
              title: '4. Host → MCP Client',
              body: 'Host находит client, которому принадлежит tool get_weather (маппинг построен при initialize). Формирует JSON-RPC request tools/call и отправляет client\'у.',
            },
            {
              title: '5. Client → MCP Server',
              body: 'Client передаёт request server\'у через transport (STDIO или HTTP). Server находит handler, валидирует arguments по JSON Schema и выполняет функцию — например, HTTP-запрос к Open-Meteo.',
            },
            {
              title: '6. Server → tool_result',
              body: 'Server упаковывает результат в content blocks (обычно type: "text" с JSON или plain text) и возвращает через JSON-RPC result. Client передаёт ответ host\'у.',
            },
            {
              title: '7. Host → LLM → User',
              body: 'Host добавляет tool_result в историю как сообщение role: tool. LLM получает «сырой» JSON погоды и формулирует человекочитаемый ответ: «В Алматы сейчас +22°C, ветер 8 м/с.»',
            },
          ]}
        />
      </Section>

      <Section title="Что видит модель на каждом шаге">
        <CodeBlock
          language="json"
          title="Шаг 3 — LLM возвращает tool_call"
          code={`{
  "role": "assistant",
  "tool_calls": [{
    "id": "call_abc123",
    "type": "function",
    "function": {
      "name": "get_weather",
      "arguments": "{\\"city\\": \\"Almaty\\"}"
    }
  }]
}`}
        />
        <CodeBlock
          language="json"
          title="Шаг 6 — tool_result возвращается модели"
          code={`{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\\"temperature\\": 22, \\"windspeed\\": 8, \\"unit\\": \\"°C\\"}"
}`}
        />
        <p>
          Модель <strong>никогда не вызывает HTTP напрямую</strong>. Она только генерирует JSON «хочу вызвать get_weather».
          Host и MCP Client — доверенная прослойка, которая реально выполняет код. Это важно для безопасности: server
          работает в sandbox, host может спросить пользователя «разрешить вызов?».
        </p>
      </Section>

      <Section title="Multi-tool и цепочки вызовов">
        <p>
          Один вопрос может породить несколько tool calls. «Сравни погоду в Алматы и Астане» → две параллельные{' '}
          <code>get_weather</code>. «Найди ресторан и построй маршрут» → <code>search_restaurants</code>, потом{' '}
          <code>get_directions</code> — последовательно, потому что второй tool зависит от результата первого.
        </p>
        <Analogy>
          <p>
            LLM — менеджер, который не ходит на склад сам, а пишет заявки (tool_calls). Host — секретарь, который носит
            заявки на склад (MCP Server) и приносит ответы (tool_results). Менеджер может выписать несколько заявок за
            один раунд и, получив ответы, решить, нужны ли ещё.
          </p>
        </Analogy>
        <Callout type="info">
          <p>
            Cursor и Claude Desktop поддерживают multi-turn tool use: модель может вызвать tool, получить результат,
            вызвать ещё один — и только потом ответить пользователю. Лимит раундов задаёт host (обычно 5–25).
          </p>
        </Callout>
      </Section>

      <Section title="Где ломается цепочка">
        <ul>
          <li>
            <strong>Tool не найден</strong> — опечатка в имени или server не запущен. Client вернёт JSON-RPC error, LLM
            попробует объяснить проблему пользователю.
          </li>
          <li>
            <strong>Невалидные arguments</strong> — server валидирует по JSON Schema до выполнения. Ошибка возвращается
            как tool_result с isError: true.
          </li>
          <li>
            <strong>Timeout</strong> — HTTP к Open-Meteo завис. Host может повторить или прервать цепочку.
          </li>
          <li>
            <strong>LLM не вызвала tool</strong> — модель «ответила из головы» вместо вызова API. Лечится хорошим
            описанием tool и system prompt «всегда используй get_weather для вопросов о погоде».
          </li>
        </ul>
      </Section>

      <ProjectNote>
        <p>
          На семинаре planner-агент проходит эту цепочку трижды за один запрос: погода (weather tool), скриншот сайта
          (Playwright tool), сохранение заметки (notes tool). Понимание lifecycle помогает дебажить: если ответ неверный —
          смотри, на каком шаге данные испортились.
        </p>
      </ProjectNote>

      <KeyIdea>
        User → Host → LLM (tool_call) → Client → Server → tool_result → LLM → User. Модель генерирует JSON, host
        выполняет. MCP стандартизирует только средние четыре шага — transport и JSON-RPC одинаковы для любого server.
      </KeyIdea>
    </>
  )
}

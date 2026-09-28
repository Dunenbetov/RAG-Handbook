import { Bot, Cable, Server, User, Wrench } from 'lucide-react'
import { StepPlayer, type Stage } from './StepPlayer'

const STAGES: Stage[] = [
  {
    icon: User,
    title: 'Запрос',
    detail: 'Пользователь: «Какая погода в Алматы?» Host получает сообщение и передаёт LLM.',
    example: 'User → Host: "Какая погода в Алматы?"',
  },
  {
    icon: Bot,
    title: 'LLM решает',
    detail: 'Модель видит список tools из MCP-серверов. Решает вызвать get_weather с аргументом city.',
    example: 'tool_call: { name: "get_weather", arguments: { city: "Almaty" } }',
  },
  {
    icon: Cable,
    title: 'Client → Server',
    detail: 'Host через MCP Client отправляет JSON-RPC tools/call на Weather Server (STDIO или HTTP).',
    example: '{ "method": "tools/call", "params": { "name": "get_weather", ... } }',
  },
  {
    icon: Server,
    title: 'Server выполняет',
    detail: 'FastMCP-сервер вызывает Open-Meteo API, возвращает structured content.',
    example: '{ "temperature": 28, "condition": "sunny", "humidity": 35 }',
  },
  {
    icon: Wrench,
    title: 'Результат → LLM',
    detail: 'Tool result попадает обратно в контекст модели как assistant tool message.',
    example: 'tool_result: "28°C, солнечно, влажность 35%"',
  },
  {
    icon: Bot,
    title: 'Финальный ответ',
    detail: 'LLM формулирует человеческий ответ на основе реальных данных, а не галлюцинации.',
    example: '«В Алматы сейчас +28°C, солнечно. Отличная погода для прогулки!»',
  },
]

export function MCPToolCallFlow() {
  return <StepPlayer title="Жизненный цикл tool call" icon={Wrench} stages={STAGES} />
}

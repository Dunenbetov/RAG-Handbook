import { Callout, KeyIdea, ProjectNote, Section, Steps } from '../../components/ui'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="FastMCP — Python за пять минут">
        <p>
          <strong>FastMCP</strong> (Prefect) — самый популярный фреймворк для MCP-серверов на Python. Он берёт на себя
          JSON Schema, JSON-RPC, transport и lifecycle — ты пишешь обычные функции с декораторами.
        </p>
        <CodeBlock
          language="bash"
          title="Установка"
          code={`pip install fastmcp httpx`}
        />
        <Callout type="info">
          <p>
            В FastMCP v3 декораторы пишутся <strong>без скобок</strong>: <code>@mcp.tool</code>, не{' '}
            <code>@mcp.tool()</code>. Type hints и docstring функции автоматически становятся JSON Schema и description
            для LLM.
          </p>
        </Callout>
      </Section>

      <Section title="Три декоратора — три примитива">
        <Steps
          items={[
            {
              title: '@mcp.tool',
              body: 'Функция с аргументами → action. Возвращает str, dict, list — FastMCP сериализует в content blocks.',
            },
            {
              title: '@mcp.resource("uri://path")',
              body: 'Функция без side-effects → read-only данные. URI может содержать {param} для параметризации.',
            },
            {
              title: '@mcp.prompt',
              body: 'Функция возвращает str → шаблон сообщения для LLM с подставленными аргументами.',
            },
          ]}
        />
        <CodeBlock
          language="python"
          title="Минимальный сервер"
          code={`from fastmcp import FastMCP

mcp = FastMCP("Demo")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

@mcp.resource("config://app")
def get_config() -> str:
    """Application config as JSON."""
    return '{"version": "1.0", "debug": false}'

@mcp.prompt
def greet(name: str) -> str:
    """Friendly greeting prompt."""
    return f"Say hello to {name} in a warm, professional tone."

if __name__ == "__main__":
    mcp.run()   # STDIO transport — default`}
        />
      </Section>

      <Section title="Полный weather-сервер на Open-Meteo">
        <p>
          Open-Meteo — бесплатный API без ключа: geocoding + forecast. Идеален для семинара и Project 5. Ниже — рабочий
          сервер с tool, resource и prompt.
        </p>
        <CodeBlock
          language="python"
          title="weather_server.py"
          code={`import httpx
from fastmcp import FastMCP

mcp = FastMCP("Weather")

SUPPORTED_CITIES = ["Almaty", "Astana", "Shymkent", "London", "Berlin"]

@mcp.resource("weather://cities")
def list_cities() -> str:
    """List of cities supported by this weather server."""
    return ", ".join(SUPPORTED_CITIES)

@mcp.tool
async def get_weather(city: str) -> dict:
    """Get current weather for a city. Use Latin city names (e.g. Almaty, Astana)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        geo_resp = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city, "count": 1, "language": "en"},
        )
        geo_resp.raise_for_status()
        results = geo_resp.json().get("results")
        if not results:
            return {"error": f"City '{city}' not found"}

        lat = results[0]["latitude"]
        lon = results[0]["longitude"]
        name = results[0]["name"]

        wx_resp = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
            },
        )
        wx_resp.raise_for_status()
        current = wx_resp.json()["current"]

        return {
            "city": name,
            "temperature_c": current["temperature_2m"],
            "humidity_pct": current["relative_humidity_2m"],
            "wind_speed_kmh": current["wind_speed_10m"],
            "weather_code": current["weather_code"],
        }

@mcp.prompt
def compare_weather(city_a: str, city_b: str) -> str:
    """Prompt template to compare weather in two cities."""
    return f"""Compare current weather in {city_a} and {city_b}.
Use the get_weather tool for each city.
Present results in a short table and say which city is warmer."""

if __name__ == "__main__":
    mcp.run()`}
        />
        <Callout type="tip">
          <p>
            Запуск в терминале для проверки: <code>python weather_server.py</code> — процесс ждёт JSON-RPC на stdin.
            В Cursor достаточно прописать server в <code>.mcp.json</code> — host запустит его сам.
          </p>
        </Callout>
      </Section>

      <Section title="mcp.run() и transport">
        <p>
          <code>mcp.run()</code> по умолчанию поднимает <strong>STDIO</strong>-transport: stdin/stdout JSON-RPC. Это то,
          что ожидают Cursor и Claude Desktop для локальных серверов.
        </p>
        <CodeBlock
          language="python"
          title="Другие режимы (для деплоя)"
          code={`# Локально — STDIO (default)
mcp.run()

# HTTP-сервер для remote access
mcp.run(transport="http", host="0.0.0.0", port=8000)`}
        />
        <p>
          Для курса и семинара всегда STDIO. HTTP понадобится, если захочешь выложить server в облако и дать доступ
          команде без установки Python локально.
        </p>
      </Section>

      <Section title="Подключение к Cursor">
        <CodeBlock
          language="json"
          title=".mcp.json"
          code={`{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["/absolute/path/to/weather_server.py"]
    }
  }
}`}
        />
        <p>
          Спроси в чате: «Какая погода в Almaty?» — агент должен вызвать <code>get_weather</code>. Если не вызывает —
          проверь, что server зелёный в MCP-панели и docstring tool понятен модели.
        </p>
      </Section>

      <ProjectNote>
        <p>
          На семинаре weather-сервер — первый из трёх. Дальше добавишь notes-сервер (save/list/read локальных заметок) и
          подключишь Playwright. Planner-агент объединит все tools в одном диалоге.
        </p>
      </ProjectNote>

      <KeyIdea>
        FastMCP: @mcp.tool, @mcp.resource, @mcp.prompt — без скобок. Type hints → JSON Schema. mcp.run() → STDIO.
        Один файл weather_server.py с httpx + Open-Meteo — полноценный MCP-сервер за ~60 строк.
      </KeyIdea>
    </>
  )
}

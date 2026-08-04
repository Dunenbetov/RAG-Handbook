import { Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Семинар недели 15: planner-агент">
        <p>
          Финальный семинар модуля 4 — собрать <strong>planner-агента</strong>, который за один диалог комбинирует три
          MCP-сервера: погоду, браузер и локальные заметки. Один вопрос пользователя → цепочка tool calls → структурированный
          план в файле.
        </p>
        <p>
          Пример запроса: «Какая погода в Алматы на выходных, что играет на sxodim.com, и сохрани план вечера в заметку
          almaty-weekend».
        </p>
      </Section>

      <Section title="Часть 1: Weather-сервер (Open-Meteo)">
        <p>
          Локальный FastMCP-сервер с <code>get_weather(city)</code> — см. урок «Свой сервер на FastMCP». API Open-Meteo
          бесплатный, ключ не нужен. Geocoding переводит «Almaty» в координаты, forecast возвращает температуру и ветер.
        </p>
        <CodeBlock
          language="bash"
          title="Проверка API вручную"
          code={`# Geocoding
curl "https://geocoding-api.open-meteo.com/v1/search?name=Almaty&count=1"

# Forecast (подставь lat/lon из ответа)
curl "https://api.open-meteo.com/v1/forecast?latitude=43.25&longitude=76.95&current=temperature_2m,wind_speed_10m"`}
        />
        <Callout type="tip">
          <p>
            Попроси агента использовать латинские названия городов. «Алматы» geocoder иногда не находит — «Almaty»
            работает стабильно.
          </p>
        </Callout>
      </Section>

      <Section title="Часть 2: Playwright — sxodim.com">
        <p>
          Подключи Playwright MCP через npx. Агент выполняет сценарий:
        </p>
        <Steps
          items={[
            { title: 'browser_navigate', body: 'Открыть https://sxodim.com' },
            { title: 'browser_snapshot', body: 'Получить DOM: афиша, даты, названия событий' },
            { title: 'browser_type (опционально)', body: 'Поиск «концерт» или фильтр по городу Алматы' },
            { title: 'browser_take_screenshot', body: 'PNG для отчёта и вставки в заметку' },
          ]}
        />
        <p>
          sxodim.com — реальный сайт с динамической вёрсткой: хорошая проверка, что агент умеет читать snapshot, а не
          галлюцинирует афишу.
        </p>
      </Section>

      <Section title="Часть 3: Notes-сервер — save / list / read">
        <p>
          Локальный FastMCP-сервер для заметок в папке <code>./notes/</code>. Три tools — минимальный CRUD без базы данных.
        </p>
        <CodeBlock
          language="python"
          title="notes_server.py (скелет)"
          code={`from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("Notes")
NOTES_DIR = Path("notes")
NOTES_DIR.mkdir(exist_ok=True)

@mcp.tool
def save_note(filename: str, content: str) -> str:
    """Save text content to a note file. Filename without extension."""
    path = NOTES_DIR / f"{filename}.md"
    path.write_text(content, encoding="utf-8")
    return f"Saved to {path}"

@mcp.tool
def list_notes() -> list[str]:
    """List all saved note filenames."""
    return [p.stem for p in NOTES_DIR.glob("*.md")]

@mcp.tool
def read_note(filename: str) -> str:
    """Read a note by filename (without .md extension)."""
    path = NOTES_DIR / f"{filename}.md"
    if not path.exists():
        return f"Note '{filename}' not found"
    return path.read_text(encoding="utf-8")

if __name__ == "__main__":
    mcp.run()`}
        />
      </Section>

      <Section title="Часть 4: Planner-агент — склейка всего">
        <p>
          Planner — не отдельный server, а <Term id="prompt">промпт</Term> + skill + три MCP-сервера в одном{' '}
          <code>.mcp.json</code>. System prompt задаёт роль; skill описывает workflow.
        </p>
        <CodeBlock
          language="markdown"
          title="Planner skill — workflow"
          code={`## Planner workflow
1. Parse user request: extract city, event preferences, note filename
2. Call get_weather(city) — wait for result
3. browser_navigate → sxodim.com → browser_snapshot
4. Synthesize plan: weather + events + recommendation
5. save_note(filename, markdown_plan)
6. Confirm to user with note filename and summary`}
        />
        <Tbl
          head={['Компонент', 'Роль в planner']}
          rows={[
            ['weather MCP', 'Фактическая погода — не галлюцинация'],
            ['playwright MCP', 'Реальная афиша с sxodim.com'],
            ['notes MCP', 'Персистентный результат — файл на диске'],
            ['planner skill', 'Порядок вызовов и формат заметки'],
          ]}
        />
      </Section>

      <Section title="Бонус: 2GIS MCP">
        <p>
          Для +баллов добавь <strong>2GIS</strong>-сервер или tool: поиск ресторанов/кинотеатров рядом с площадкой
          концерта. Planner тогда строит маршрут «концерт → ужин» с адресами и рейтингами.
        </p>
        <Callout type="info">
          <p>
            2GIS API требует ключ — получи на dev.2gis.com. Оберни в <code>@mcp.tool search_places(query, lat, lon)</code>.
            Это типичный паттерн: любой REST API → одна функция → MCP tool.
          </p>
        </Callout>
      </Section>

      <Section title="Чек-лист перед демо">
        <Steps
          items={[
            { title: '.mcp.json', body: 'weather, notes, playwright — все зелёные в MCP-панели Cursor' },
            { title: 'Skill planner', body: 'SKILL.md с workflow из 6 шагов' },
            { title: 'Тестовый запрос', body: 'Один промпт → заметка almaty-weekend.md существует и содержит погоду + афишу' },
            { title: 'Скриншот', body: 'В notes или отдельно — доказательство, что sxodim.com реально открывался' },
          ]}
        />
      </Section>

      <ProjectNote>
        <p>
          Этот семинар — прямой прототип Project 5. Если planner работает в Cursor, ты уже на 70% пути: останется
          упаковать в README, добавить обработку ошибок и написать skill для edge cases (город не найден, сайт недоступен).
        </p>
      </ProjectNote>

      <KeyIdea>
        Семинар = weather (Open-Meteo) + Playwright (sxodim.com) + notes (save/list/read) + planner skill. Один запрос —
        три servers, цепочка tool calls, результат на диске. Бонус: 2GIS для маршрута и мест рядом.
      </KeyIdea>
    </>
  )
}

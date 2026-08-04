import { Analogy, Callout, KeyIdea, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Зачем MCP в ресторанном агенте">
        <p>
          Агент без внешних данных будет «выдумывать» адреса и рейтинги. ТЗ требует минимум <strong>2 из 3</strong>{' '}
          <Term id="mcp-server">MCP-серверов</Term>, каждый — <strong>отдельный процесс</strong> с реальным парсингом
          сайтов через <Term id="playwright-mcp">Playwright MCP</Term> или Stagehand MCP. LLM вызывает tools через{' '}
          <Term id="tool-calling">function calling</Term>, а не через hardcode в коде приложения.
        </p>
        <Analogy>
          <p>
            MCP-сервер здесь — как официант, который ходит на кухню (2GIS, Chocolife) и приносит свежие данные.
            LLM — это sommelier, который из полученного составляет рекомендацию. Если sommelier сам «придумывает» меню
            без официанта — это галлюцинация, а не проект.
          </p>
        </Analogy>
      </Section>

      <Section title="Три MCP-сервера: что каждый делает">
        <Tbl
          head={['Сервер', 'Источник', 'Tool', 'Возвращает']}
          rows={[
            [
              '2GIS',
              '2gis.kz',
              'search_restaurants(query, location="Алматы")',
              'name, address, rating, price_range, cuisine, working_hours, phone',
            ],
            [
              'Chocolife',
              'chocolife.me/restorany-kafe-i-bary',
              'search_deals(category="рестораны", city="Алматы")',
              'title, restaurant_name, original_price, discount_price, discount_percent, description, url',
            ],
            [
              'ABR Group (бонус)',
              'Сайты сети (Del Papa, Бочка и др.)',
              'get_restaurant_info(name)',
              'name, address, menu_highlights, average_check, booking_url',
            ],
          ]}
        />
        <p>
          Для сдачи достаточно <strong>2GIS + Chocolife</strong> (25 баллов MCP). ABR Group — расширение: полезно для
          рекомендаций по конкретным сетям и демонстрации третьего сервера.
        </p>
      </Section>

      <Section title="Playwright MCP vs Stagehand MCP">
        <p>
          Оба варианта из ТЗ — browser automation как MCP tool внутри вашего сервера или как внешний MCP, к которому
          обращается ваш FastMCP-сервер:
        </p>
        <Tbl
          head={['Вариант', 'Пакет', 'Когда выбирать']}
          rows={[
            ['Playwright MCP', '@anthropic/mcp-playwright', 'Стабильный де-факто стандарт, много примеров с курса'],
            ['Stagehand MCP', '@stagehand/mcp', 'AI-driven navigation, если вёрстка сайта часто меняется'],
          ]}
        />
        <p>
          Типичная схема для 2GIS: ваш FastMCP-сервер получает tool call → внутри вызывает Playwright (navigate →
          fill search → scrape карточки) → возвращает JSON-массив ресторанов. Chocolife — аналогично по каталогу акций.
        </p>
        <Callout type="tip" title="Кэширование и rate limit">
          <p>
            2GIS и Chocolife могут блокировать частые запросы. Сохраняй результаты поиска в локальный JSON-кэш на
            15–30 минут, добавляй задержку между запросами (1–2 сек). На демо используй заранее прогретый кэш — меньше
            сюрпризов при проверке.
          </p>
        </Callout>
      </Section>

      <Section title="STDIO vs SSE: отдельные процессы">
        <p>
          ТЗ прямо требует: MCP-сервер — <strong>отдельный процесс</strong>, запускаемый через{' '}
          <Term id="stdio-transport">stdio</Term> или SSE (<Term id="streamable-http">Streamable HTTP</Term>). Host
          (ваше приложение или Cursor) поднимает subprocess и общается JSON-RPC по stdin/stdout.
        </p>
        <CodeBlock
          language="json"
          title=".cursor/mcp.json или конфиг host (пример)"
          code={`{
  "mcpServers": {
    "twogis": {
      "command": "python",
      "args": ["mcp_servers/twogis/server.py"],
      "env": { "PLAYWRIGHT_BROWSERS_PATH": "0" }
    },
    "chocolife": {
      "command": "python",
      "args": ["mcp_servers/chocolife/server.py"]
    }
  }
}`}
        />
        <p>
          В Gradio-приложении тот же принцип: при старте <code>app.py</code> поднимаете MCP clients к обоим серверам
          или используете SDK (mcp Python client), который spawnит процессы. Главное — tools видны LLM как внешние
          инструменты, а не inline-функции.
        </p>
      </Section>

      <Section title="FastMCP: каркас сервера 2GIS">
        <CodeBlock
          language="python"
          title="mcp_servers/twogis/server.py (упрощённый каркас)"
          code={`from fastmcp import FastMCP
from pydantic import BaseModel

mcp = FastMCP("twogis-restaurants")

class Restaurant(BaseModel):
    name: str
    address: str
    rating: float
    price_range: str
    cuisine: str
    working_hours: str
    phone: str

@mcp.tool()
async def search_restaurants(
    query: str,
    location: str = "Алматы",
) -> list[Restaurant]:
    """
    Ищет рестораны на 2gis.kz по запросу и городу.
    Использует Playwright для парсинга результатов поиска.
    """
    # 1. Playwright: открыть 2gis.kz, ввести query + location
    # 2. Дождаться карточек, извлечь поля
    # 3. Вернуть list[Restaurant] — не строку, structured output
    raw = await scrape_2gis(query, location)  # ваша реализация
    return [Restaurant(**item) for item in raw]

if __name__ == "__main__":
    mcp.run()  # STDIO по умолчанию`}
        />
        <p>
          Chocolife-сервер — та же структура с <code>search_deals</code>. Схемы полей должны совпадать с ТЗ — проверяющий
          смотрит, что tool возвращает осмысленные данные, а не пустой список.
        </p>
      </Section>

      <Section title="План реализации по дням (MCP-фокус)">
        <Steps
          items={[
            {
              title: 'День 1–2: Playwright в изоляции',
              body: (
                <p>
                  Напиши скрипт, который без MCP открывает 2GIS, ищет «итальянская кухня центр» и печатает 3–5
                  карточек. Только когда парсинг стабилен — оборачивай в FastMCP tool.
                </p>
              ),
            },
            {
              title: 'День 3: FastMCP + MCP Inspector',
              body: (
                <p>
                  Запусти сервер через MCP Inspector или <code>mcp dev server.py</code>. Вручную вызови{' '}
                  <code>search_restaurants</code> — убедись, что JSON валидный. Повтори для Chocolife.
                </p>
              ),
            },
            {
              title: 'День 4: Подключение к LLM',
              body: (
                <p>
                  Зарегистрируй tools в <code>agent/tools.py</code>, передай схемы в OpenAI/Gemini API. Прогон: «Где
                  поужинать на Достык?» — в логах должен быть tool_call на search_restaurants, не текст «Del Papa» из
                  памяти модели.
                </p>
              ),
            },
            {
              title: 'День 5 (опционально): ABR Group',
              body: (
                <p>
                  Третий сервер для get_restaurant_info по сети ABR. Полезно, если в демо упоминаешь Del Papa или
                  Бочку — данные с официального сайта выглядят убедительнее.
                </p>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Чек-лист перед интеграцией с LLM">
        <ul>
          <li>Оба сервера стартуют отдельной командой из README без ошибок.</li>
          <li>
            <code>search_restaurants</code> и <code>search_deals</code> возвращают ≥1 реальный результат на тестовый
            запрос.
          </li>
          <li>README описывает: установка Playwright browsers, переменные окружения, команда запуска каждого сервера.</li>
          <li>Нет API-ключей в репозитории — только <code>.env.example</code>.</li>
        </ul>
      </Section>

      <KeyIdea>
        MCP в Project 5 — не декорация, а 25 баллов: отдельные stdio/SSE процессы, Playwright для 2GIS и Chocolife,
        structured tools с полями из ТЗ. Сначала парсинг в чистом скрипте, потом FastMCP, потом подключение к LLM —
        только так ты не потратишь неделю на «агента», который не видит реальных ресторанов.
      </KeyIdea>
    </>
  )
}

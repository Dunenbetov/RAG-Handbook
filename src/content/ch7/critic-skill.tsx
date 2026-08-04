import { Analogy, Callout, KeyIdea, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Custom skill «Ресторанный критик»">
        <p>
          Помимо vision в LLM, ТЗ требует отдельный <strong>custom tool</strong>{' '}
          <code>analyze_restaurant_photo</code> — skill, который студент пишет сам. LLM вызывает его через{' '}
          <Term id="tool-calling">function calling</Term> при получении фото ресторана, интерьера или блюда. Результат —
          structured dict, который влияет на итоговую рекомендацию. За это — <strong>5 баллов</strong>.
        </p>
        <Analogy>
          <p>
            Vision в LLM — это «первый взгляд» на фото. Critic skill — формальная экспертиза с протоколом: уровень
            заведения, статус (романтический, семейный, деловой), описание и confidence. Как разница между «красиво»
            и ресторанной рецензией с оценкой.
          </p>
        </Analogy>
      </Section>

      <Section title="Сигнатура из ТЗ">
        <CodeBlock
          language="python"
          title="Обязательный контракт функции"
          code={`def analyze_restaurant_photo(image_url: str) -> dict:
    """
    Анализирует фото ресторана и возвращает оценку заведения.
    Вызывается LLM как tool через function calling.
    """
    # Студент реализует логику самостоятельно:
    # - Передать image_url в vision-модель (GPT-4o, Gemini и т.д.)
    # - Сформировать промпт для оценки уровня и статуса ресторана
    # - Вернуть структурированный результат
    return {
        "level": "mid-range",       # уровень заведения
        "status": "романтический",  # статус / тип атмосферы
        "description": "...",       # краткая характеристика
        "confidence": 0.85,         # уверенность модели 0..1
    }`}
        />
        <Tbl
          head={['Поле', 'Примеры значений', 'Смысл']}
          rows={[
            ['level', 'budget | mid-range | premium | fine-dining', 'Ценовой и качественный сегмент'],
            ['status', 'романтический | семейный | деловой | casual | trendy', 'Тип аудитории и атмосферы'],
            ['description', '2–4 предложения на русском', 'Что видно на фото: интерьер, подача, освещение'],
            ['confidence', '0.0 – 1.0', 'Насколько модель уверена при плохом фото — ниже порога можно сказать «не уверен»'],
          ]}
        />
      </Section>

      <Section title="Реализация через vision LLM">
        <p>
          Skill не обязан быть отдельной нейросетью — достаточно вызова multimodal LLM с жёстким промптом и парсингом
          JSON. Рекомендуемый паттерн: structured output или response_format json_schema.
        </p>
        <CodeBlock
          language="python"
          title="agent/skills/restaurant_critic.py"
          code={`import json
from openai import OpenAI

client = OpenAI()

CRITIC_PROMPT = """Ты — ресторанный критик. По фото интерьера или блюда оцени заведение.
Верни ТОЛЬКО JSON:
{
  "level": "budget|mid-range|premium|fine-dining",
  "status": "романтический|семейный|деловой|casual|trendy",
  "description": "2-4 предложения",
  "confidence": 0.0-1.0
}
Если фото не про еду/ресторан — confidence < 0.3 и опиши проблему."""

async def analyze_restaurant_photo(image_url: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",  # или gpt-4o для сложных кадров
        messages=[
            {"role": "system", "content": CRITIC_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Оцени это фото."},
                    {"type": "image_url", "image_url": {"url": image_url, "detail": "low"}},
                ],
            },
        ],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)`}
        />
        <Callout type="tip" title="Локальные файлы из Gradio">
          <p>
            Gradio отдаёт filepath на диск — конвертируй в base64 data URL или залей временно на fal/OpenAI-compatible
            host. Для отладки достаточно <code>file://</code> через base64 embedding в message.
          </p>
        </Callout>
      </Section>

      <Section title="Регистрация skill как tool">
        <p>
          Skill должен быть в том же списке tools, что и MCP. В agent loop маршрутизируй локально:
        </p>
        <CodeBlock
          language="python"
          title="Dispatch в agent/llm.py"
          code={`LOCAL_TOOLS = {
    "analyze_restaurant_photo": analyze_restaurant_photo,
}

async def execute_tool(name: str, args: dict):
    if name in LOCAL_TOOLS:
        return await LOCAL_TOOLS[name](**args)
    return await mcp_session.call_tool(name, args)`}
        />
        <p>
          В system prompt добавь правило: «При фото ресторана или блюда — сначала analyze_restaurant_photo, затем при
          необходимости search_restaurants с учётом level и status».
        </p>
      </Section>

      <Section title="Как проверить перед сдачей">
        <Steps
          items={[
            {
              title: 'Tool вызывается автоматически',
              body: (
                <p>
                  Загрузи фото интерьера в Gradio без текста «вызови critic» — в логах должен появиться tool_call
                  analyze_restaurant_photo, не только vision в user message.
                </p>
              ),
            },
            {
              title: 'Structured output валиден',
              body: (
                <p>
                  Все четыре поля присутствуют, confidence — число, level/status из осмысленного набора. JSON парсится
                  без ошибок.
                </p>
              ),
            },
            {
              title: 'Результат влияет на ответ',
              body: (
                <p>
                  Финальная рекомендация LLM упоминает level/status («подойдёт для романтического ужина») — не
                  игнорирует output skill.
                </p>
              ),
            },
            {
              title: 'Плохое фото',
              body: (
                <p>
                  Размытый кадр или не еда — confidence ниже, description объясняет неуверенность. Это плюс к
                  качеству, не минус.
                </p>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Skills vs MCP tools">
        <Tbl
          head={['', 'MCP tool', 'Custom skill']}
          rows={[
            ['Пример', 'search_restaurants', 'analyze_restaurant_photo'],
            ['Процесс', 'Отдельный MCP server', 'Функция в agent/'],
            ['Данные', 'Внешний сайт (2GIS)', 'Vision LLM'],
            ['Кто пишет', 'Парсинг + FastMCP', 'Промпт + JSON parsing — полностью студент'],
          ]}
        />
        <p>
          <Term id="skills">Skills</Term> в смысле курса (markdown-инструкции) можно добавить файл{' '}
          <code>skills/restaurant_critic.md</code> с правилами интерпретации level/status — но для баллов достаточно
          working tool с корректной сигнатурой.
        </p>
      </Section>

      <KeyIdea>
        analyze_restaurant_photo — ваш custom tool: image_url на вход, dict с level, status, description, confidence на
        выход. Реализация через vision LLM + JSON schema, регистрация рядом с MCP tools, автовызов LLM при фото.
        Критерий сдачи — tool в логах и влияние на рекомендацию, не просто «модель посмотрела картинку».
      </KeyIdea>
    </>
  )
}

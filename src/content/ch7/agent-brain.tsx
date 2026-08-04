import { Analogy, Callout, KeyIdea, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Мозг агента: LLM + tools + память + vision">
        <p>
          «Мозг» — LLM с поддержкой <Term id="tool-calling">tool calling</Term>, которая сама решает, когда вызвать{' '}
          <code>search_restaurants</code>, <code>search_deals</code>, <code>analyze_restaurant_photo</code> или ответить
          без tools. Плюс <strong>сессионная память</strong>: агент помнит предыдущие реплики в рамках одного диалога
          Gradio. Плюс <Term id="vlm">vision</Term>: если пользователь приложил фото блюда или интерьера — модель
          «видит» его в том же запросе.
        </p>
        <Analogy>
          <p>
            LLM здесь — диспетчер в колл-центре: слушает клиента, смотрит на присланное фото, решает, кому перезвонить
            (MCP tool), собирает ответ и передаёт дальше в TTS. Hardcode «если слово „ресторан" — вызови 2GIS» — это не
            агент, а if-else, за который снимут баллы.
          </p>
        </Analogy>
      </Section>

      <Section title="Выбор LLM: что рекомендует ТЗ">
        <Tbl
          head={['Модель', 'Сильные стороны', 'На что смотреть']}
          rows={[
            ['GPT-4o-mini', 'Дёшево, быстро, стабильный tool calling', 'Хороший дефолт для routing и коротких ответов'],
            ['GPT-4o', 'Лучше reasoning и vision', 'Дороже; имеет смысл для analyze_restaurant_photo'],
            ['Gemini 2.0 Flash', 'Быстрый tool calling, щедрый free tier', 'Удобен при жёстком бюджете'],
            ['Claude Sonnet', 'Сильный reasoning, аккуратные tool calls', 'Хорош для длинных system prompt с правилами'],
          ]}
        />
        <p>
          Для бонуса (+10) используй <Term id="model-routing">model routing</Term>: простые запросы («привет») — на
          mini/Flash, сложные (фото + «куда сходить») — на 4o или Sonnet. Vision обязателен при image input: GPT-4o,
          Gemini Flash, Claude — все multimodal из коробки.
        </p>
      </Section>

      <Section title="Регистрация tools: схемы для LLM">
        <p>
          Tools делятся на два класса: <strong>MCP tools</strong> (проксируются с серверов) и <strong>local custom
          tools</strong> (<code>analyze_restaurant_photo</code>). LLM видит единый список — разница только в runtime,
          который выполняет вызов.
        </p>
        <CodeBlock
          language="python"
          title="agent/tools.py — схемы tools (OpenAI-формат)"
          code={`TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_restaurants",
            "description": "Поиск ресторанов на 2GIS по запросу и городу",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Кухня, название, район"},
                    "location": {"type": "string", "default": "Алматы"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_deals",
            "description": "Акции и скидки Chocolife на рестораны",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "default": "рестораны"},
                    "city": {"type": "string", "default": "Алматы"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_restaurant_photo",
            "description": "Оценка ресторана по фото интерьера или блюда",
            "parameters": {
                "type": "object",
                "properties": {
                    "image_url": {"type": "string"},
                },
                "required": ["image_url"],
            },
        },
    },
]`}
        />
        <Callout type="danger" title="Типичная ошибка">
          <p>
            Вызывать <code>search_restaurants("итальянская")</code> в коде до LLM — hardcode. Правильно: передать tools
            в API, получить <code>tool_calls</code> от модели, выполнить, вернуть <code>tool</code> role message и
            попросить финальный ответ.
          </p>
        </Callout>
      </Section>

      <Section title="Agent loop: tool calling в действии">
        <CodeBlock
          language="python"
          title="agent/llm.py — упрощённый цикл"
          code={`async def run_agent(messages: list, tools: list) -> str:
    while True:
        response = await client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )
        msg = response.choices[0].message
        if not msg.tool_calls:
            return msg.content  # финальный текст для TTS

        messages.append(msg)
        for call in msg.tool_calls:
            name = call.function.name
            args = json.loads(call.function.arguments)
            if name.startswith("search_") or name == "get_restaurant_info":
                result = await mcp_client.call_tool(name, args)
            else:
                result = await local_tools[name](**args)
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(result, ensure_ascii=False),
            })`}
        />
        <p>
          Ограничь число итераций (3–5), чтобы агент не ушёл в бесконечный цикл tool calls. Логируй каждый вызов — на
          демо и при отладке это доказательство, что MCP реально работает.
        </p>
      </Section>

      <Section title="Сессионная память">
        <p>
          ТЗ требует: агент <strong>помнит историю диалога в сессии</strong>. В Gradio храни список messages в{' '}
          <code>gr.State</code> или в памяти на время сессии пользователя:
        </p>
        <CodeBlock
          language="python"
          title="Память в Gradio"
          code={`def chat(user_text, history, session_messages):
    session_messages.append({"role": "user", "content": user_text})
    reply = run_agent(session_messages, TOOLS)
    session_messages.append({"role": "assistant", "content": reply})
    history = history + [(user_text, reply)]
    return history, session_messages

# Кнопка «Новый диалог» — session_messages = [system_prompt]`}
        />
        <p>
          System prompt задай один раз в начале: роль «проводник по ресторанам Алматы», правила вызывать MCP при
          вопросах о местах и акциях, при фото — <code>analyze_restaurant_photo</code>, ответы 3–5 предложений (15–30
          сек озвучки).
        </p>
      </Section>

      <Section title="Vision: фото блюда и интерьера">
        <p>
          Когда пользователь загружает image в Gradio, добавь в user message content-массив с text + image_url (или
          base64):
        </p>
        <CodeBlock
          language="python"
          title="Multimodal user message"
          code={`{
    "role": "user",
    "content": [
        {"type": "text", "text": "Что это за блюдо и куда похоже по уровню?"},
        {
            "type": "image_url",
            "image_url": {"url": image_data_url, "detail": "low"},  # бонус: detail:low
        },
    ],
}`}
        />
        <p>
          LLM может сама описать блюдо и предложить похожие рестораны — но для баллов за custom skill (5) нужен отдельный
          tool <code>analyze_restaurant_photo</code> с structured output. Vision в LLM и critic skill дополняют друг
          друга: модель видит картинку и может вызвать skill для формальной оценки level/status.
        </p>
        <Callout type="tip" title="detail:low для бюджета">
          <p>
            Для routing и preview используй <code>detail: low</code> — меньше vision-токенов. Для финального анализа в
            critic skill можно передать полное изображение или отдельный вызов vision-модели.
          </p>
        </Callout>
      </Section>

      <Section title="System prompt: минимальный каркас">
        <CodeBlock
          language="text"
          title="SYSTEM_PROMPT (адаптируй под себя)"
          code={`Ты — AI-проводник по ресторанам Алматы. Отвечай на русском.

Правила:
- На вопросы «где поесть», «посоветуй ресторан» — вызывай search_restaurants.
- На вопросы про скидки и акции — search_deals.
- Если пользователь прислал фото ресторана/блюда — analyze_restaurant_photo.
- Комбинируй данные tools в одну рекомендацию с адресом и аргументом.
- Ответ для озвучки: 3–5 предложений, без markdown и списков из 10 пунктов.
- Не выдумывай адреса — только данные из tools.`}
        />
      </Section>

      <KeyIdea>
        Мозг Project 5 — LLM, которая сама маршрутизирует запросы на MCP и custom tools, держит session memory и
        обрабатывает vision input. GPT-4o-mini или Gemini Flash для everyday, routing на 4o для сложных кейсов. Hardcode
        tool calls — главный антипаттерн; лог tool_calls — лучшее доказательство на сдаче.
      </KeyIdea>
    </>
  )
}

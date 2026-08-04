import { Analogy, Callout, KeyIdea, Section, Steps, Tbl } from '../../components/ui'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Карта минного поля Project 5">
        <Analogy>
          <p>
            Project 5 — пять модальностей и три внешних источника данных, склеенные в один Gradio. Каждый слой может
            «работать» изолированно и ломаться в связке. Ниже — порядок отладки из ТЗ и ловушки, на которых теряют и
            баллы, и доллары на fal.ai.
          </p>
        </Analogy>
      </Section>

      <Section title="Рекомендуемый порядок отладки">
        <p>ТЗ формулирует явно: avatar video — в последнюю очередь. Полная последовательность:</p>
        <Steps
          items={[
            {
              title: '1. MCP-серверы (2GIS, Chocolife)',
              body: (
                <p>
                  MCP Inspector или прямой вызов tools. <code>search_restaurants</code> и{' '}
                  <code>search_deals</code> возвращают реальные JSON, не заглушки. README с командами запуска.
                </p>
              ),
            },
            {
              title: '2. LLM + Tool Calling',
              body: (
                <p>
                  Текстовый запрос «ресторан на Достык» → в логах tool_call → ответ с адресом из 2GIS. Session memory:
                  второй вопрос «а со скидкой?» → search_deals без потери контекста.
                </p>
              ),
            },
            {
              title: '3. ASR (Whisper)',
              body: (
                <p>
                  Голосовой ввод в Gradio → тот же pipeline, что и текст. Проверь русский язык и фоновый шум.
                </p>
              ),
            },
            {
              title: '4. TTS + Voice Clone',
              body: (
                <p>
                  Один раз clone → сохрани <code>voice_id</code>. TTS на короткий тестовый текст. Слушай артефакты до
                  подключения avatar.
                </p>
              ),
            },
            {
              title: '5. Avatar Video — только когда 1–4 стабильны',
              body: (
                <p>
                  Каждый прогон Creatify Aurora стоит денег. Первый успешный end-to-end — на коротком ответе (15 сек
                  audio).
                </p>
              ),
            },
          ]}
        />
        <Callout type="danger" title="Главное правило из ТЗ">
          <p>
            Не запускай генерацию video, пока LLM, MCP и TTS не отлажены. Иначе ты платишь за Aurora, чтобы услышать
            галлюцинацию или пустой tool result.
          </p>
        </Callout>
      </Section>

      <Section title="Моки для дорогих шагов">
        <p>
          На этапе отладки LLM и MCP подменяй TTS и avatar константами — ТЗ прямо советует экономить на дорогих
          компонентах:
        </p>
        <CodeBlock
          language="python"
          title="config.py — флаги отладки"
          code={`USE_MOCK_TTS = True      # assets/mock_reply.wav
USE_MOCK_AVATAR = True   # assets/mock_avatar.mp4 или статичный gif

# Перед финальным демо и записью demo.mp4:
USE_MOCK_TTS = False
USE_MOCK_AVATAR = False`}
        />
        <ul>
          <li>Mock TTS: заранее записанный WAV 5 сек — pipeline до video проверяется бесплатно.</li>
          <li>Mock avatar: короткий loop mp4 или placeholder в Gradio Video — UI и async flow без fal.</li>
          <li>После зелёного MCP + LLM — один полный прогон с реальным fal для demo.</li>
        </ul>
      </Section>

      <Section title="Бюджет: таблица из ТЗ">
        <Tbl
          head={['Сервис', 'Для чего', 'Ориентир бюджета']}
          rows={[
            ['fal.ai', 'Creatify Aurora, MiniMax TTS, Voice Clone', '~$10 на проект'],
            ['OpenAI', 'GPT-4o-mini (LLM + Whisper ASR)', '~$5 на проект'],
            ['Google AI', 'Gemini Flash (LLM, альтернатива)', 'Free tier возможен'],
          ]}
        />
        <p>
          Общий ориентир — <strong>$15–20</strong>. Основные «дыры» в бюджете: многократный clone (клонируй один раз),
          длинные ответы TTS, частые прогоны Aurora, vision на full detail без <code>detail: low</code>.
        </p>
      </Section>

      <Section title="Бонус +10: оптимизация стоимости">
        <Tbl
          head={['Техника', 'Как применить в Project 5']}
          rows={[
            ['Model routing', 'mini/Flash для простых реплик, 4o — для vision + critic'],
            ['Prompt caching', 'Длинный system prompt кэшируется (OpenAI / Anthropic) — меньше input tokens'],
            ['detail: low', 'Vision input в Gradio и critic skill с low resolution'],
            ['Кэш MCP', 'Повторный поиск «итальянская центр» — из JSON, не из Playwright'],
            ['Короткие ответы', '15–30 сек речи — меньше TTS chars и короче video'],
          ]}
        />
        <p>
          В README укажи, сколько реально потратил — это часть требований к сдаче и аргумент для бонуса.
        </p>
      </Section>

      <Section title="Безопасность: ключи и архив">
        <Callout type="danger" title="Никогда в репозиторий">
          <ul>
            <li><code>.env</code> с OPENAI_API_KEY, FAL_KEY — только локально.</li>
            <li>В ZIP — <code>.env.example</code> с пустыми placeholder.</li>
            <li>Проверь <code>git status</code> перед архивом: ключи не должны попасть в demo video screen recording.</li>
          </ul>
        </Callout>
        <CodeBlock
          language="bash"
          title=".env.example"
          code={`OPENAI_API_KEY=sk-...
FAL_KEY=...
VOICE_ID=...          # после clone
LLM_MODEL=gpt-4o-mini
USE_MOCK_TTS=false
USE_MOCK_AVATAR=false`}
        />
      </Section>

      <Section title="Ловушки баллов и времени">
        <Steps
          items={[
            {
              title: 'Hardcode вместо tool calling',
              body: (
                <p>
                  «Если „ресторан" in query» — минус и за MCP, и за LLM. Единственный допустимый путь — tool_calls от
                  модели.
                </p>
              ),
            },
            {
              title: 'MCP как обычная функция',
              body: (
                <p>
                  Импорт <code>scrape_2gis</code> напрямую в app.py без MCP-процесса — формально не проект по ТЗ. Нужен
                  отдельный server.py + stdio.
                </p>
              ),
            },
            {
              title: 'Блокировка 2GIS / Chocolife',
              body: (
                <p>
                  Частые запросы без delay — пустые результаты на демо. Кэш + user-agent + пауза 1–2 сек.
                </p>
              ),
            },
            {
              title: 'Чужой голос и stock-фото',
              body: (
                <p>
                  ТЗ требует ваш голос и ваше (или с согласия) фото. Библиотечные голоса ElevenLabs — не засчитывают
                  clone.
                </p>
              ),
            },
            {
              title: 'Демо без MCP в кадре',
              body: (
                <p>
                  На видео 2–3 мин покажи запрос, где видно, что данные с 2GIS/Chocolife (название, адрес, скидка) —
                  не общие фразы модели.
                </p>
              ),
            },
            {
              title: 'venv в ZIP',
              body: (
                <p>
                  ТЗ запрещает. Архив раздувается до гигабайт, проверяющий не запустит. Только requirements.txt.
                </p>
              ),
            },
          ]}
        />
      </Section>

      <Section title="План на 12 дней (кратко)">
        <Tbl
          head={['Дни', 'Фокус']}
          rows={[
            ['1–3', 'Playwright парсинг 2GIS + Chocolife → FastMCP серверы'],
            ['4–5', 'LLM agent loop, tools, session memory, critic skill'],
            ['6', 'Gradio UI: text + image + audio in, text out (без video)'],
            ['7', 'ASR + voice clone + TTS с моками avatar'],
            ['8–9', 'Первый реальный Aurora прогон, полировка lip sync'],
            ['10–11', 'README, .env.example, demo.mp4, бонус routing/caching'],
            ['12', 'Чистый прогон с нуля по README, упаковка ZIP'],
          ]}
        />
      </Section>

      <KeyIdea>
        Отладка Project 5 — строго MCP → LLM → ASR → TTS → avatar. Моки для fal до финала, бюджет $15–20, ключи только в
        .env.example в архиве. Avatar последним — каждый тест Aurora стоит денег. Hardcode и «MCP без процесса» — самые
        частые потери баллов.
      </KeyIdea>
    </>
  )
}

import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { CostRouteDashboard } from '../../components/interactive/CostRouteDashboard'

export default function Lesson() {
  return (
    <>
      <Section title="Почему мультимодальность сжигает бюджет">
        <p>
          Текстовый RAG-запрос — копейки. Один I2V-клип Kling — доллары. Один час голосового агента с GPT-4o + Whisper + TTS —
          сотни вызовов. <strong>Cost routing</strong> — осознанный выбор «дешёвый / дорогой» пути на каждом шаге pipeline, а не
          «везде лучшая модель».
        </p>
        <CostRouteDashboard />
      </Section>

      <Section title="detail:low для vision">
        <p>
          Vision-токены в GPT-4o считаются от разрешения картинки. Параметр <code>detail: low</code> ресайзит изображение до
          512px по длинной стороне — для меню, скриншотов UI и фото блюд этого достаточно.
        </p>
        <CodeBlock
          language="python"
          title="Экономия на vision-токенах"
          code={`# Дорого: detail high на 4000×3000 фото
# image_url={"url": url, "detail": "high"}

# Дешевле в ~3–5× для типичного food photo:
image_part = {
    "type": "image_url",
    "image_url": {"url": url, "detail": "low"},
}

# Ещё дешевле: ресайзить ДО отправки (PIL max 1024px)
from PIL import Image
img = Image.open(path)
img.thumbnail((1024, 1024))
img.save("/tmp/resized.jpg")`}
        />
        <Callout type="info">
          <p>
            Исключение: OCR мелкого текста на документе или таблица с цифрами — тогда <code>high</code> или предварительный
            crop области интереса.
          </p>
        </Callout>
      </Section>

      <Section title="Prompt cache и повторяющийся контекст">
        <p>
          OpenAI и Anthropic кэшируют <strong>повторяющийся префикс</strong> <Term id="prompt">промпта</Term> (system + tools + длинный контекст). Если
          system prompt и описания tools не меняются между запросами — второй и последующие вызовы дешевле.
        </p>
        <Steps
          items={[
            {
              title: 'Стабильный system prompt',
              body: 'Не генерируй system строку динамически с timestamp — ломаешь cache hit.',
            },
            {
              title: 'Tools JSON фиксированный',
              body: 'Одинаковый порядок ключей в schema; не добавляй лишние поля между запросами.',
            },
            {
              title: 'Длинный RAG-контекст в начале',
              body: 'Если база знаний статична на сессию — клади её в начало, меняй только user message в конце.',
            },
          ]}
        />
      </Section>

      <Section title="Model routing: cheap vs expensive">
        <Tbl
          head={['Этап', 'Cheap tier', 'Premium tier', 'Правило routing']}
          rows={[
            ['Brain (LLM)', 'gpt-4o-mini, Gemini Flash', 'gpt-4o, Claude Sonnet', 'Mini для черновика/tool loop; 4o только для финального ответа или vision-сложных фото'],
            ['ASR', 'Whisper local / API', '—', 'API для демо; local если много минут'],
            ['TTS', 'OpenAI TTS, MiniMax base', 'ElevenLabs', 'Флаг USE_PREMIUM=1 на демо-день'],
            ['Video', 'Wan 2.1', 'Kling Pro / Veo', '≤3 клипа на сессию; I2V вместо T2V для контроля'],
            ['Vision', 'detail:low + 4o-mini', 'detail:high + 4o', 'analyze_restaurant_photo — mini + low'],
          ]}
        />
        <CodeBlock
          language="python"
          title="Простой router по env"
          code={`def pick_llm(task: str):
    if task == "vision_analysis":
        return "gpt-4o-mini"   # + detail low
    if task == "tool_planner":
        return "gpt-4o-mini"
    if os.getenv("FINAL_POLISH") == "1":
        return "gpt-4o"
    return "gpt-4o-mini"`}
        />
      </Section>

      <Section title="Бюджет студенческого проекта">
        <Analogy title="Аналогия: prepaid на телефоне">
          <p>
            $15–20 на Project 5 — как пакет минут: тратишь на video и premium TTS осознанно, остальное — на mini-модели и local
            Whisper. Каждый «полный прогон» avatar pipeline — отметь в таблице расходов.
          </p>
        </Analogy>
        <ul>
          <li>Заведи <code>.env</code> с лимитами: <code>MAX_VIDEO_CLIPS=3</code>, <code>USE_PREMIUM=0</code> по умолчанию.</li>
          <li>Логируй каждый API-вызов: timestamp, model, estimated_cost — приложи к README.</li>
          <li>Моки для отладки: фиксированный wav вместо TTS, статичный mp4 вместо Kling — пока чинишь LLM/tools.</li>
          <li>Не гоняй video studio в CI; один golden-path тест с записанными файлами.</li>
          <li>Кэшируй эмбеддинги и ASR-транскрипты повторных демо-фраз.</li>
        </ul>
        <Callout type="danger" title="Типичный слив бюджета">
          <p>
            Десять перегенераций Kling «пока лицо не понравится» за вечер — минус весь лимит проекта. Сначала добейся стабильного
            keyframe (diffusion с seed), потом один I2V.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В README Project 5 добавь секцию «Бюджет»: таблица сервисов, примерная стоимость одного user session, какие флаги
          включают premium. Преподаватель оценивает инженерную зрелость — не размер счёта.
        </p>
      </ProjectNote>

      <KeyIdea>
        Экономия мультимодального агента: detail:low и resize для vision, prompt cache для стабильного system, model routing
        (mini vs 4o, Wan vs Kling), лимиты на video и моки при отладке. CostRouteDashboard — mental model: tier × число клипов =
        бюджет сессии.
      </KeyIdea>
    </>
  )
}

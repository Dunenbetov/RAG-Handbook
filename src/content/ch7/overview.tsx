import { Analogy, Callout, KeyIdea, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Что за проект и сколько на него времени">
        <p>
          Project 5 — финальный проект модуля 6: мультимодальный AI-агент — персональный проводник по ресторанам
          Алматы. Срок — <strong>12 дней</strong>. Команда — <strong>1–2 человека</strong>. Сдаёшь ZIP-архив с кодом,
          README и видео-демо на 2–3 минуты. Максимум — <strong>100 баллов + 10 бонусных</strong>.
        </p>
        <p>
          Агент принимает <strong>текст, изображение и аудио</strong>, отвечает <strong>текстом и видео с говорящим
          аватаром</strong> (клон твоего голоса и лица), ищет реальные данные через <Term id="mcp">MCP</Term>-серверы
          (2GIS, Chocolife, опционально ABR Group) и обёрнут в <Term id="gradio">Gradio</Term>-интерфейс.
        </p>
        <Analogy>
          <p>
            Типичный сценарий: пользователь спрашивает «Где поужинать в центре Алматы на двоих, бюджет 15 000 тенге?»
            — агент через MCP находит рестораны и акции, LLM формирует рекомендацию, клонированный голос озвучивает
            ответ, а аватар на видео «произносит» его с lip sync. Это не чат-бот с заготовками, а полноценный
            мультимодальный пайплайн.
          </p>
        </Analogy>
      </Section>

      <Section title="Архитектура: что должно работать вместе">
        <p>
          Пайплайн из ТЗ — линейная цепочка с ветвлением на tools. Вход пользователя проходит через ASR (если
          аудио), затем LLM с <Term id="tool-calling">tool calling</Term> и vision, далее TTS с клонированным голосом
          и финально — генерация avatar video.
        </p>
        <CodeBlock
          language="text"
          title="Поток данных"
          code={`Вход (text / image / audio)
    ↓
  ASR (если audio) → текст
    ↓
  LLM + session memory + vision (если image)
    ↓ tool calls
  MCP: search_restaurants | search_deals | get_restaurant_info
  Custom: analyze_restaurant_photo
    ↓
  TTS (MiniMax speech-02 + voice_id)
    ↓
  Avatar video (Creatify Aurora / Kling Avatar)
    ↓
  Выход: текст + video.mp4`}
        />
        <p>
          Обязательные компоненты по ТЗ: ASR (Whisper API / local Whisper / NVIDIA Parakeet), LLM с tool calling и
          vision, минимум 2 MCP-сервера, voice clone + TTS, avatar video, custom skill «Ресторанный критик», Gradio
          frontend.
        </p>
      </Section>

      <Section title="Структура баллов: куда смотреть в первую очередь">
        <Tbl
          head={['Критерий', 'Баллы', 'Что проверяют']}
          rows={[
            ['MCP-серверы', '25', 'Минимум 2 сервера (2GIS + Chocolife), tools реально вызываются, данные не захардкожены'],
            ['LLM + Tool Calling + Memory', '20', 'LLM сама выбирает tool, ответ на основе данных; история диалога в сессии'],
            ['Vision-input', '10', 'Фото блюда или интерьера учитывается в ответе'],
            ['Skill «Ресторанный критик»', '5', 'Custom tool analyze_restaurant_photo: level, status, description, confidence'],
            ['Voice Clone + TTS', '10', 'Голос клонирован (≥10 сек сэмпл), аудио генерируется клоном'],
            ['Avatar Video', '20', 'Видео с аватаром, корректный lip sync (Aurora / Kling)'],
            ['README + видео-демо', '10', 'Инструкция запуска + демо 2–3 мин'],
            ['Бонус: оптимизация стоимости', '+10', 'Model routing, caching, detail:low для изображений'],
          ]}
        />
        <p>
          Самые «тяжёлые» по риску блоки — <strong>MCP (25)</strong> и <strong>Avatar Video (20)</strong>. MCP нужно
          поднять в первую очередь: без реальных данных агент превращается в галлюцинатор. Avatar — в последнюю: каждый
          прогон Creatify Aurora стоит денег.
        </p>
      </Section>

      <Section title="Формат сдачи: ZIP, README, демо">
        <p>
          Имя архива: <strong>Имя_Фамилия.zip</strong> (например, <code>Алихан_Сейткали.zip</code>). Внутри — корневая
          папка с тем же именем и чистый код, который запускается по README.
        </p>
        <CodeBlock
          language="text"
          title="Структура архива (из ТЗ)"
          code={`Имя_Фамилия/
├── README.md
├── requirements.txt
├── .env.example              # БЕЗ реальных ключей
├── app.py                    # Главный Gradio
├── agent/
│   ├── llm.py                # LLM + tool calling
│   ├── tools.py              # Схемы tools для LLM
│   └── pipeline.py           # ASR → LLM → TTS → Avatar
├── mcp_servers/
│   ├── twogis/server.py + README.md
│   ├── chocolife/server.py + README.md
│   └── abr_group/            # бонус
├── voice/
│   ├── clone.py
│   ├── tts.py
│   └── my_voice_sample.wav   # ≥10 сек
├── avatar/
│   ├── generate.py
│   └── my_photo.jpg          # 512×512+, фронтальное
├── assets/
│   └── demo.mp4              # ваше видео-демо
└── config.py

# НЕ включать: venv/, .env, __pycache__/, node_modules/, *.bin / *.pt`}
        />
        <Callout type="danger" title="Перед архивированием">
          <ul>
            <li>Удалить <code>venv/</code>, <code>.env</code> с реальными ключами, <code>__pycache__/</code>, тяжёлые веса моделей.</li>
            <li>Оставить только <code>.env.example</code> с названиями переменных без значений.</li>
            <li>Видео-демо 2–3 мин: показать текстовый запрос, голосовой ввод, фото блюда, вызов MCP, финальный avatar video.</li>
          </ul>
        </Callout>
      </Section>

      <Section title="README: что обязательно описать">
        <Tbl
          head={['Раздел', 'Содержание']}
          rows={[
            ['Описание', '2–3 предложения: что делает агент, для кого'],
            ['Архитектура', 'Схема pipeline (Mermaid или ASCII)'],
            ['Модели', 'Какие LLM, ASR, TTS, avatar выбрали и почему'],
            ['Запуск', 'pip install → .env → MCP-серверы → app.py — пошагово'],
            ['Скриншоты', 'Работающий Gradio UI'],
            ['Стоимость', 'Сколько потратили на API за проект'],
            ['Улучшения', 'Что бы сделали при большем времени'],
          ]}
        />
      </Section>

      <Section title="Бюджет и сроки">
        <p>
          Общий бюджет по ТЗ — <strong>~$15–20</strong>: fal.ai (~$10 на voice clone, TTS и avatar), OpenAI (~$5 на
          LLM + ASR) или бесплатный tier Google AI для Gemini Flash. На этапе отладки используй моки для TTS и video —
          подробнее в уроке «Отладка и бюджет».
        </p>
        <p>
          12 дней — плотный, но реалистичный срок, если следовать порядку отладки: MCP → LLM/tools → ASR → TTS/clone →
          avatar последним. Не начинай с Gradio «красоты» — сначала заставь pipeline возвращать правильный текст с
          реальными данными.
        </p>
      </Section>

      <Section title="Главные сюрпризы ТЗ">
        <Callout type="danger" title="Три вещи, о которые спотыкается большинство">
          <ul>
            <li>
              <strong>MCP-сервер — не Python-функция.</strong> Это отдельный процесс по протоколу MCP (stdio или SSE).
              Hardcode вызова парсера вместо tool call — потеря баллов за MCP и за LLM.
            </li>
            <li>
              <strong>Avatar video — последний шаг.</strong> Каждый тест Aurora стоит реальных денег. Сначала убедись,
              что LLM, MCP и TTS стабильны.
            </li>
            <li>
              <strong>Voice clone — ваш голос.</strong> Не бери готовые голоса из библиотеки. Минимум 10 секунд чистой
              записи без фонового шума.
            </li>
          </ul>
        </Callout>
      </Section>

      <KeyIdea>
        Project 5 — capstone мультимодального модуля: реальные MCP-данные, LLM с tools и vision, клонированный голос и
        говорящий аватар. Читай ТЗ как рубрику: 25 баллов за MCP, 20 за avatar, 10 за README и демо. ZIP без секретов,
        демо 2–3 мин, отладка строго слева направо — MCP первым, video последним.
      </KeyIdea>
    </>
  )
}

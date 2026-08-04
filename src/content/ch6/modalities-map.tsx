import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Три слоя мультимодального агента">
        <p>
          Любой мультимодальный агент — это не «одна модель на всё», а конвейер из трёх слоёв:{' '}
          <strong>Input</strong> (что пользователь подаёт), <strong>Brain</strong> (где принимаются решения),{' '}
          <strong>Output</strong> (что пользователь получает). На лекции модуля 5 это называют «картой модальностей» — карта
          помогает не смешивать задачи и выбирать правильный API на каждом шаге.
        </p>
        <Tbl
          head={['Слой', 'Модальности', 'Типичные модели / API']}
          rows={[
            ['Input', 'Текст, голос, изображение, видео', 'Whisper (ASR), загрузка файла, камера в Gradio'],
            ['Brain', 'Текст + tool calls + vision', 'GPT-4o, Gemini 2.5, Qwen 2.5, Claude — с vision и function calling'],
            ['Output', 'Текст, речь, картинка, видео', 'MiniMax TTS, DALL·E / GPT-Image, Kling / Veo, D-ID avatar'],
          ]}
        />
        <Analogy title="Аналогия: переводческое бюро">
          <p>
            Input — секретарь, который принимает заказ на любом языке и переводит его во внутренний протокол (текст + метаданные).
            Brain — главный переводчик, который думает, звонит в справочные (tools), смотрит на приложенные фото. Output —
            типограф, который печатает ответ, записывает аудио или монтирует видео. Один человек не делает всё — но клиент видит
            единый сервис.
          </p>
        </Analogy>
      </Section>

      <Section title="Native multimodal vs pipeline">
        <p>
          Есть два принципиально разных подхода к мультимодальности. Понимание разницы — ключ к выбору архитектуры и бюджета.
        </p>
        <VS
          left={{
            title: 'Native multimodal',
            tone: 'good',
            children: (
              <>
                <p>
                  Одна модель принимает несколько модальностей <strong>на входе и/или на выходе</strong> в одном API-вызове.
                  Примеры: GPT-4o (текст + картинки на вход), Gemini 2.5 Flash (аудио на вход),{' '}
                  <strong>Qwen2.5-Omni</strong> (текст + аудио + vision в одном чекпоинте).
                </p>
                <ul>
                  <li>Меньше склеек — меньше точек отказа</li>
                  <li>Модель сама выравнивает модальности</li>
                  <li>Дороже за запрос, сложнее отладка «где сломалось»</li>
                </ul>
              </>
            ),
          }}
          right={{
            title: 'Pipeline (склейка специалистов)',
            tone: 'neutral',
            children: (
              <>
                <p>
                  Каждый этап — отдельная модель: ASR → <Term id="llm">LLM</Term> → TTS → avatar video. Именно так устроены
                  Gradio-агенты недели 19 и финальный Project 5.
                </p>
                <ul>
                  <li>Можно менять любой блок независимо</li>
                  <li>Дешевле на «дешёвых» этапах (Whisper + mini LLM + MiniMax)</li>
                  <li>Больше латентности и кода склейки</li>
                </ul>
              </>
            ),
          }}
        />
        <Callout type="tip" title="Когда что выбирать">
          <p>
            Для прототипа и учебного проекта почти всегда выгоднее <strong>pipeline</strong>: ты видишь, на каком шаге упало, и
            можешь заменить один блок (например, ElevenLabs вместо MiniMax). Native multimodal — когда нужна минимальная
            задержка и один вендор (OpenAI Realtime API, Gemini Live).
          </p>
        </Callout>
      </Section>

      <Section title="Qwen Omni и граница «одной модели»">
        <p>
          <strong>Qwen2.5-Omni</strong> — показательный пример native-подхода в open-source: модель понимает речь, текст и
          изображения и может генерировать текст и речь. На практике в курсе мы чаще используем Qwen как Brain (текст + vision),
          а аудио-вход/выход выносим в Whisper и MiniMax — так проще контролировать стоимость и качество голоса.
        </p>
        <CodeBlock
          language="text"
          title="Архитектура агента Project 5 (текстовая схема)"
          code={`┌─────────────┐     ┌──────────────────────────────────┐     ┌─────────────┐
│   INPUT     │     │            BRAIN (LLM)              │     │   OUTPUT    │
│             │     │                                   │     │             │
│  Audio  ────┼────►│  System prompt + tools (2GIS,      │     │             │
│  Photo  ────┼────►│  Chocolife) + session memory       ├────►│  TTS        │
│  Text   ────┼────►│  + vision (analyze photo)          │     │  Avatar     │
│             │     │                                   │     │  Text       │
└─────────────┘     └──────────────────────────────────┘     └─────────────┘
       │                            │                                │
   Whisper ASR              GPT-4o / Qwen 2.5                 MiniMax / D-ID
   (если голос)             + MCP tool calls                  / Kling Avatar`}
        />
        <p>
          Стрелки между блоками — это твой Python-код: функции, которые передают строки, байты аудио и пути к файлам. Brain
          почти всегда работает в <strong>текстовом</strong> представлении; модальности конвертируются до и после него.
        </p>
      </Section>

      <Section title="Input → Brain → Output: типовые маршруты">
        <Steps
          items={[
            {
              title: 'Голосовой ассистент',
              body: 'Input: аудио → Whisper ASR → текст. Brain: LLM + tools. Output: TTS (MiniMax) → audio.wav. Опционально: avatar video (D-ID, Kling).',
            },
            {
              title: 'Фото-консультант',
              body: 'Input: JPEG меню ресторана. Brain: vision-LLM (GPT-4o detail:low для экономии) + MCP 2GIS. Output: текст + озвучка.',
            },
            {
              title: 'Video studio',
              body: 'Input: текст сценария. Brain: LLM пишет раскадровку. Output: T2V (Kling) по ключевым кадрам → ffmpeg concat.',
            },
            {
              title: 'Native shortcut',
              body: 'Input: аудио напрямую в Gemini 2.5 Flash. Brain + часть output в одном вызове. Меньше кода, выше счёт за минуту.',
            },
          ]}
        />
      </Section>

      <ProjectNote>
        <p>
          Project 5 — это pipeline-агент: голос → ASR → LLM с MCP и vision → TTS → avatar. Карта модальностей из этого урока —
          чек-лист: для каждого шага в README укажи, какая модальность на входе/выходе и какой API ты выбрал.
        </p>
      </ProjectNote>

      <KeyIdea>
        Мультимодальный агент = Input (приведи к понятному Brain формату) + Brain (текст, tools, память) + Output (верни нужную
        модальность). Native multimodal упрощает код, pipeline даёт контроль и экономию — в курсе мы строим pipeline.
      </KeyIdea>
    </>
  )
}

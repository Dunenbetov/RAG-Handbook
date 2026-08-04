import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Цель семинара: voice-to-avatar за один вечер">
        <p>
          На семинаре модуля 5 собираем pipeline от микрофона до mp4 с говорящим аватаром — мини-версия Project 5 без MCP.
          Пользователь говорит → агент отвечает голосом и «лицом» на экране. Все модальности уже знакомы по урокам главы; здесь —
          склейка и порядок отладки.
        </p>
        <Analogy>
          <p>
            Это как репетиция спектакля: сначала читают текст вслух (ASR + LLM), потом подключают звук (TTS), и только когда
            реплики стабильны — выводят актёра на сцену (avatar video). Не начинай с Kling, пока Whisper путает «Достык» и
            «доступ».
          </p>
        </Analogy>
      </Section>

      <Section title="Архитектура pipeline">
        <CodeBlock
          language="text"
          title="Voice → Avatar (полная цепочка)"
          code={`[Mic / wav file]
      │
      ▼
  Whisper ASR ──────────────────────────────┐
      │ text                                 │
      ▼                                      │
  GPT-4o-mini (+ optional system prompt)     │
      │ reply text                           │
      ├──────────────────┐                   │
      ▼                  ▼                   │
  gr.Textbox         MiniMax TTS              │
  (показать)              │ audio.wav         │
                          ▼                   │
                    D-ID / Kling Avatar ◄─────┘
                          │
                          ▼
                    gr.Video (mp4)`}
        />
        <p>
          Brain на семинаре — простой chat без tools. В Project 5 между ASR и TTS вставляешь MCP (2GIS, Chocolife) и vision skill —
          интерфейс pipeline-функции тот же.
        </p>
      </Section>

      <Section title="Пошаговая интеграция">
        <Steps
          items={[
            {
              title: 'Шаг 0: Gradio-каркас',
              body: 'Mic + Button + Textbox + Audio + Video. Pipeline пока echo: верни текст "heard: ..." без API — проверь, что filepath от Audio доходит.',
            },
            {
              title: 'Шаг 1: ASR',
              body: 'Подключи Whisper API. Тест: одна записанная фраза «Где поужинать в центре?» → стабильный текст. Логируй latency.',
            },
            {
              title: 'Шаг 2: LLM',
              body: 'System prompt ресторанного ассистента (без tools). Вход: transcript. Выход: короткий reply, 2–3 предложения — длинный текст дороже в TTS и avatar.',
            },
            {
              title: 'Шаг 3: TTS',
              body: 'MiniMax speech-02 → сохрани wav. Проверь Audio output в Gradio до avatar. Длительность < 15 сек для первых тестов.',
            },
            {
              title: 'Шаг 4: Avatar',
              body: 'Статичное photo (512×512, лицо анфас) + audio → D-ID talks или Kling Avatar. Poll до ready. Video output.',
            },
            {
              title: 'Шаг 5: Voice clone (опционально)',
              body: 'Загрузи 15 сек reference → voice_id → тот же TTS pipeline. Сравни с preset-голосом.',
            },
          ]}
        />
      </Section>

      <Section title="Код: единая pipeline-функция">
        <CodeBlock
          language="python"
          title="seminar_voice_avatar.py — ядро"
          code={`def voice_to_avatar(audio_path: str | None, photo_path: str | None):
    if not audio_path:
        raise gr.Error("Запишите голос или загрузите wav")

    user_text = whisper_transcribe(audio_path)
    reply = llm_chat(
        system="Ты — дружелюбный гид по ресторанам Алматы. Ответь кратко.",
        user=user_text,
    )
    audio_out = minimax_tts(reply, voice_id=os.getenv("VOICE_ID", "Wise_Woman"))

    if photo_path:
        video_out = did_create_talk(photo_path, audio_out)
    else:
        video_out = None

    return user_text, reply, audio_out, video_out`}
        />
      </Section>

      <Section title="Отладка: порядок, который экономит нервы">
        <Tbl
          head={['Симптом', 'Вероятная причина', 'Что проверить']}
          rows={[
            ['Пустой transcript', 'Формат audio, слишком тихая запись', 'Сохрани wav, проиграй локально; 16 kHz mono'],
            ['LLM отвечает английским', 'Нет инструкции языка в system', '«Отвечай на русском» в system prompt'],
            ['TTS обрывается', 'Лимит символов / timeout API', 'Укороти reply; retry с backoff'],
            ['Avatar не sync', 'Audio длиннее лимита D-ID', 'Обрежь audio ffmpeg -t 30'],
            ['Video чёрный экран', 'Фото с профиля или слишком маленькое', 'Анфас, min 512px, jpeg без прозрачности'],
          ]}
        />
        <Callout type="tip">
          <p>
            Держи закешированные файлы <code>fixtures/demo_question.wav</code> и <code>fixtures/avatar_photo.jpg</code> — один
            клик «Run pipeline» без микрофона на каждой итерации avatar API.
          </p>
        </Callout>
      </Section>

      <Section title="От семинара к Project 5">
        <ul>
          <li>Добавь <Term id="rag">RAG</Term>-память сессии в <code>gr.State</code> — history в LLM.</li>
          <li>Замени заглушку LLM на agent с tool calls (2GIS через MCP).</li>
          <li>Skill <code>analyze_restaurant_photo</code> — параллельная ветка: Image + Text → Text.</li>
          <li>README: схема pipeline + таблица API keys + оценка стоимости одного demo.</li>
        </ul>
      </Section>

      <ProjectNote>
        <p>
          Семинарный артеfact — рабочий Gradio с voice in и video out. Для зачёта Project 5 этого мало, но каркас pipeline
          функции и порядок отладки ASR → LLM → TTS → avatar переносишь один в один.
        </p>
      </ProjectNote>

      <KeyIdea>
        Voice-to-avatar — цепочка ASR → LLM → TTS → avatar API, отлаживается строго слева направо. Gradio Blocks оборачивает одну
        pipeline-функцию; фото + audio → mp4. Семинар — репетиция Project 5 без MCP, с тем же порядком интеграции.
      </KeyIdea>
    </>
  )
}

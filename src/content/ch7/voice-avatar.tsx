import { Analogy, Callout, KeyIdea, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Голос и лицо: два дорогих модуля">
        <p>
          После того как LLM сформировала текстовый ответ, пайплайн идёт в <Term id="voice-clone">voice clone</Term> +{' '}
          <Term id="tts">TTS</Term>, затем в avatar video. ТЗ рекомендует <strong>MiniMax через fal.ai</strong>: clone
          один раз (~$0.50), дальше speech-02 на каждый ответ. Avatar — <strong>Creatify Aurora</strong> или Kling
          Avatar V2. Это 30 баллов (10 + 20) и основная статья расходов после отладки.
        </p>
        <Analogy>
          <p>
            Voice clone — запись вашего голоса в студии один раз. TTS — диктор за кадром читает новый текст тем же
            голосом. Avatar video — монтажёр накладывает этот звук на ваше фото и синхронизирует губы. Если сценарий
            (текст LLM) ещё сырой — не трать деньги на монтаж.
          </p>
        </Analogy>
      </Section>

      <Section title="MiniMax: clone + TTS на fal.ai">
        <Tbl
          head={['Модель', 'Endpoint', 'Назначение', 'Ориентир цены']}
          rows={[
            ['MiniMax Voice Clone', 'fal-ai/minimax/voice-clone', 'Создание voice_id из сэмпла ≥10 сек', '~$0.50 за клон'],
            ['MiniMax Speech-02-HD', 'fal-ai/minimax/speech-02-hd', 'TTS клонированным голосом, лучше качество', '~$50/1M chars'],
            ['MiniMax Speech-02-Turbo', 'fal-ai/minimax/speech-02-turbo', 'TTS быстрее, дешевле HD', '~$30/1M chars'],
          ]}
        />
        <p>Альтернативы из ТЗ: ElevenLabs Voice Changer, Kling Create Voice — если MiniMax недоступен.</p>
        <CodeBlock
          language="python"
          title="voice/clone.py + voice/tts.py (из ТЗ)"
          code={`import fal_client

# Шаг 1: клонирование (один раз за проект)
clone_result = fal_client.subscribe("fal-ai/minimax/voice-clone", arguments={
    "audio_url": "https://your-host/my_voice_sample.wav",  # мин. 10 сек
    "preview_text": "Привет! Это тест клонированного голоса.",
    "language": "Russian",
})
voice_id = clone_result["voice_id"]
# Сохрани voice_id в config / .env — не клонируй каждый запуск

# Шаг 2: TTS на каждый ответ агента
tts_result = fal_client.subscribe("fal-ai/minimax/speech-02-hd", arguments={
    "text": "Рекомендую ресторан Del Papa на Достык, 85.",
    "voice_id": voice_id,
    "language": "Russian",
})
audio_url = tts_result["audio"]["url"]`}
        />
        <Callout type="tip" title="Запись сэмпла">
          <ul>
            <li>Минимум 10 секунд, тихая комната, без музыки и эха.</li>
            <li>Естественная речь, не шёпот и не крик — иначе clone «плывёт» на TTS.</li>
            <li>Формат WAV или MP3, положи в <code>voice/my_voice_sample.wav</code> в архив (не секрет).</li>
          </ul>
        </Callout>
      </Section>

      <Section title="Creatify Aurora: avatar video">
        <Tbl
          head={['Параметр', 'Значение']}
          rows={[
            ['Endpoint', 'fal-ai/creatify/aurora'],
            ['Input', 'image_url + audio_url + prompt (визуальный стиль)'],
            ['Output', 'video .mp4, lip sync, мимика'],
            ['Разрешение', '720p по умолчанию'],
            ['Длительность', 'До ~60 сек, привязана к длине audio'],
          ]}
        />
        <CodeBlock
          language="python"
          title="avatar/generate.py — Creatify Aurora (из ТЗ)"
          code={`import fal_client

result = fal_client.subscribe("fal-ai/creatify/aurora", arguments={
    "image_url": "https://your-host/my_photo.jpg",
    "audio_url": audio_url,  # из шага TTS
    "prompt": (
        "4K studio interview, medium close-up. "
        "Soft key-light, light-grey backdrop. "
        "Presenter faces lens, steady eye-contact. Ultra-sharp."
    ),
    "guidance_scale": 1,
    "audio_guidance_scale": 2,
    "resolution": "720p",
})
video_url = result["video"]["url"]`}
        />
        <p>
          Альтернативы: <code>fal-ai/kling-video/ai-avatar/v2/standard</code> (дешевле),{' '}
          <code>fal-ai/kling-video/ai-avatar/v2/pro</code> (premium). Для сдачи достаточно одной модели с корректным lip
          sync.
        </p>
      </Section>

      <Section title="Требования к фото аватара">
        <p>ТЗ и документация Aurora чувствительны к качеству входного портрета:</p>
        <ul>
          <li><strong>Фронтальный портрет</strong>, взгляд в камеру.</li>
          <li><strong>Минимум 512×512 px</strong> (лучше 720p и выше).</li>
          <li>Хорошее освещение, нейтральный фон.</li>
          <li>Без очков (или стабильные), без рук у лица, без экстремальных ракурсов.</li>
          <li><strong>Ваше фото</strong> или партнёра по команде с согласия — не stock.</li>
        </ul>
        <Callout type="danger" title="Длина ответа = длина видео = деньги">
          <p>
            Aurora генерирует video по длине audio. Длинный ответ LLM на 60 сек — дорогой прогон и долгое ожидание.
            Ограничь финальный текст 15–30 секундами речи (примерно 400–700 символов).
          </p>
        </Callout>
      </Section>

      <Section title="Интеграция в pipeline.py">
        <CodeBlock
          language="python"
          title="agent/pipeline.py — склейка (каркас)"
          code={`async def run_pipeline(text_input, image=None, audio=None) -> dict:
    # 1. ASR
    if audio is not None:
        text_input = await transcribe(audio)

    # 2. LLM (+ vision if image)
    reply_text = await run_agent(build_messages(text_input, image))

    # 3. TTS (мок на этапе отладки — см. pitfalls)
    if config.USE_MOCK_TTS:
        audio_url = "assets/mock_reply.wav"
    else:
        audio_url = await synthesize_speech(reply_text, voice_id=config.VOICE_ID)

    # 4. Avatar (только когда USE_MOCK_AVATAR=False)
    if config.USE_MOCK_AVATAR:
        video_url = "assets/mock_avatar.mp4"
    else:
        video_url = await generate_avatar(config.AVATAR_PHOTO_URL, audio_url)

    return {"text": reply_text, "audio_url": audio_url, "video_url": video_url}`}
        />
      </Section>

      <Section title="Gradio: вывод text + video">
        <CodeBlock
          language="python"
          title="Минимальный вывод в app.py"
          code={`with gr.Blocks() as demo:
    with gr.Row():
        text_in = gr.Textbox(label="Вопрос")
        audio_in = gr.Audio(sources=["microphone", "upload"], type="filepath")
        image_in = gr.Image(type="filepath", label="Фото блюда / интерьера")
    btn = gr.Button("Спросить")
    text_out = gr.Textbox(label="Ответ")
    video_out = gr.Video(label="Аватар")

    btn.click(
        fn=pipeline_wrapper,
        inputs=[text_in, image_in, audio_in, state],
        outputs=[text_out, video_out, state],
    )`}
        />
        <p>
          Пока avatar генерируется 30–120 сек — покажи пользователю текст сразу после LLM, video подгружай асинхронно
          или spinner «Генерируем видео…». На демо заранее прогрей один успешный прогон.
        </p>
      </Section>

      <KeyIdea>
        Voice + Avatar — 30 баллов и главный расход fal.ai: один раз clone MiniMax, TTS speech-02 на каждый ответ,
        Aurora или Kling на photo + audio. Фото 512×512 фронтально, ответ LLM короткий. Не тестируй video, пока текст и
        audio не стабильны — каждый прогон Aurora стоит денег.
      </KeyIdea>
    </>
  )
}

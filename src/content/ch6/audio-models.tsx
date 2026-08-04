import { Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { SpeechPipelineFlow } from '../../components/interactive/SpeechPipelineFlow'

export default function Lesson() {
  return (
    <>
      <Section title="Аудио в агенте: три задачи">
        <p>
          Аудио-модальность в pipeline-агенте раскладывается на три независимые задачи: распознать речь (ASR), понять{' '}
          <strong>кто</strong> говорит (diarization), озвучить ответ (TTS) — и опционально клонировать голос. Brain между ASR и
          TTS почти всегда текстовый <Term id="llm">LLM</Term>.
        </p>
        <SpeechPipelineFlow />
        <p>
          Интерактив выше — упрощённая схема без diarization и avatar. Полный voice-to-avatar пайплайн разберём в семинаре и в
          Project 5.
        </p>
      </Section>

      <Section title="ASR: Speech-to-Text">
        <Tbl
          head={['Вариант', 'Плюсы', 'Минусы']}
          rows={[
            ['OpenAI Whisper API', 'Простой HTTP, хороший русский/казахский, не нужен GPU', 'Платно за минуту, аудио уходит в облако'],
            ['Local Whisper (faster-whisper)', 'Бесплатно, офлайн, контроль модели (large-v3)', 'Нужен GPU/CPU, сам деплоишь'],
            ['NVIDIA Parakeet (NeMo)', 'Быстрый streaming ASR, хорош для realtime', 'Сложнее setup, меньше готовых туториалов на русском'],
          ]}
        />
        <CodeBlock
          language="python"
          title="Whisper API — минимальный вызов"
          code={`from openai import OpenAI

client = OpenAI()
with open("question.wav", "rb") as audio:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio,
        language="ru",   # подсказка языка повышает точность
    )
user_text = transcript.text`}
        />
        <Callout type="tip">
          <p>
            Для Gradio-агента сохраняй аудио из <code>gr.Audio</code> в WAV 16 kHz mono — Whisper ожидает именно такой формат.
            Лишние перекодирования через pydub лучше делать один раз в pipeline-функции.
          </p>
        </Callout>
      </Section>

      <Section title="Diarization: кто когда говорил">
        <p>
          <strong>Diarization</strong> нужна, когда в одной записи несколько спикеров (совещание, интервью). Для голосового бота
          с одним пользователем — пропускаешь.
        </p>
        <Steps
          items={[
            {
              title: 'pyannote.audio',
              body: 'De-facto стандарт open-source: pipeline «speaker-diarization-3.1», метки SPEAKER_00, SPEAKER_01 + таймкоды. Требует Hugging Face token и принятие лицензии модели.',
            },
            {
              title: 'Gemini structured output',
              body: 'Загружаешь аудио в Gemini 2.5 Flash, просишь JSON: [{speaker, start, end, text}]. Удобно, если ASR и diarization хочешь в одном вызове — но дороже и менее воспроизводимо, чем pyannote.',
            },
          ]}
        />
        <CodeBlock
          language="python"
          title="pyannote — скелет пайплайна"
          code={`from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=HF_TOKEN,
)
diarization = pipeline("meeting.wav")

for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{speaker}: {turn.start:.1f}s – {turn.end:.1f}s")`}
        />
      </Section>

      <Section title="TTS: Text-to-Speech">
        <Tbl
          head={['Сервис', 'Качество / языки', 'Когда брать']}
          rows={[
            ['ElevenLabs', 'Очень натуральный EN/RU, много preset-голосов', 'Демо и Gradio week 19, если бюджет позволяет'],
            ['MiniMax speech-02', 'Хороший русский, API через fal/Replicate', 'Project 5 по ТЗ: основной TTS'],
            ['OpenAI TTS', 'Простой API, 6 голосов', 'Быстрый прототип без клонирования'],
          ]}
        />
        <CodeBlock
          language="python"
          title="MiniMax TTS через fal (пример)"
          code={`import fal_client

result = fal_client.subscribe("fal-ai/minimax/speech-02-hd", arguments={
    "text": "Рекомендую ресторан Del Papa на проспекте Достык.",
    "voice_id": "Wise_Woman",
    "speed": 1.0,
})
audio_url = result["audio"]["url"]   # скачать → отдать в Gradio Audio`}
        />
      </Section>

      <Section title="Voice clone">
        <p>
          <strong>Voice cloning</strong> — TTS с timbre конкретного человека по 10–30 секундам эталонного аудио. В Project 5 —
          обязательный элемент: агент «говорит» клонированным голосом.
        </p>
        <Steps
          items={[
            {
              title: 'F5-TTS (open-source)',
              body: 'Локальный или RunPod: reference audio + текст → wav. Нужен GPU, зато полный контроль и нет платы за символ.',
            },
            {
              title: 'MiniMax voice clone (fal)',
              body: 'Загружаешь reference clip, получаешь voice_id, дальше обычный speech-02 с этим id. Проще для сдачи проекта.',
            },
          ]}
        />
        <Callout type="warn">
          <p>
            <strong>Bark</strong> (Suno) — legacy-модель 2023 года: медленная, нестабильная на русском, нет API-уровня ElevenLabs.
            В 2026 году для курса не рекомендуется; используй MiniMax, ElevenLabs или F5-TTS.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Минимальный audio-стек Project 5: Whisper API (ASR) → LLM → MiniMax TTS (voice clone). Diarization — только если
          делаешь бонус с записью диалога. Запиши в README длительность эталонного аудио для клона и формат файла.
        </p>
      </ProjectNote>

      <KeyIdea>
        ASR переводит голос в текст для Brain, TTS — текст обратно в голос для пользователя. Whisper API для старта, local Whisper
        для экономии на объёме. Voice clone — MiniMax/fal или F5-TTS; Bark устарел. Diarization — pyannote или Gemini JSON, когда
        спикеров больше одного.
      </KeyIdea>
    </>
  )
}

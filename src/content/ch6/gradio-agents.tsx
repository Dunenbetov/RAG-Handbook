import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Gradio как клей для мультимодальности">
        <p>
          Неделя 19 — четыре Gradio-приложения, каждое демонстрирует свой pipeline. Общий паттерн:{' '}
          <strong>Blocks + pipeline-функция</strong>, которая принимает виджеты на входе и возвращает кортеж выходов. UI не знает
          про Whisper или Kling — только про <code>(audio_in,) → (text_out, audio_out)</code>.
        </p>
        <Analogy>
          <p>
            Gradio — витрина ресторана: посетитель нажимает кнопки, не видя кухни. Pipeline-функция — повар, который по
            стандартному рецепту гоняет заказ через ASR, LLM и TTS. Сменить TTS-провайдера = поменять рецепт, витрина та же.
          </p>
        </Analogy>
      </Section>

      <Section title="Шаблон 1: ASR → VLM → TTS">
        <p>
          Голосовой вопрос → текст → LLM с vision (фото меню) → озвученный ответ. Базовый мультимодальный ассистент без avatar.
        </p>
        <CodeBlock
          language="python"
          title="gradio_voice_vision.py — скелет Blocks"
          code={`import gradio as gr

def pipeline(audio, photo, history):
    # 1. ASR
    text = transcribe_whisper(audio)
    # 2. Brain: LLM + optional vision
    reply = ask_llm(text, image=photo, history=history)
    # 3. TTS
    wav_path = synthesize_minimax(reply)
    history = history + [(text, reply)]
    return reply, wav_path, history

with gr.Blocks(title="Voice + Vision Agent") as demo:
    chat = gr.State([])
    with gr.Row():
        mic = gr.Audio(sources=["microphone"], type="filepath")
        img = gr.Image(type="filepath", label="Фото (опционально)")
    btn = gr.Button("Спросить", variant="primary")
    text_out = gr.Textbox(label="Ответ")
    audio_out = gr.Audio(label="Озвучка")
    btn.click(pipeline, [mic, img, chat], [text_out, audio_out, chat])

demo.launch()`}
        />
      </Section>

      <Section title="Шаблон 2: TTS → D-ID avatar">
        <p>
          Текст ответа озвучивается, затем <strong>D-ID</strong> (или Creatify) получает photo + audio → mp4 с говорящей головой.
          Два последовательных API-вызова; Brain уже отработал на этапе <Term id="llm">LLM</Term>.
        </p>
        <Steps
          items={[
            { title: 'LLM генерирует reply', body: 'Обычный chat completion или tool-augmented ответ.' },
            { title: 'TTS → wav/mp3', body: 'MiniMax или ElevenLabs, сохранить локальный файл.' },
            { title: 'D-ID talks API', body: 'source_url фото + audio → poll status → video mp4.' },
            { title: 'Gradio Video output', body: 'Вернуть path или URL в gr.Video.' },
          ]}
        />
      </Section>

      <Section title="Шаблон 3: ElevenLabs + Kling">
        <p>
          Комбо week 19: премиум-голос ElevenLabs + I2V Kling для «оживления» статичного keyframe. Дороже, но впечатляет на
          демо. Routing: если <code>USE_PREMIUM</code> — ElevenLabs, иначе MiniMax.
        </p>
        <CodeBlock
          language="python"
          title="Фрагмент routing в pipeline"
          code={`def tts_route(text: str) -> str:
    if os.getenv("USE_PREMIUM") == "1":
        return elevenlabs_tts(text, voice_id="...")
    return minimax_tts(text, voice_id="Wise_Woman")

def avatar_route(image_path: str, audio_path: str) -> str:
    # Kling I2V или D-ID в зависимости от флага
    if os.getenv("AVATAR_MODE") == "kling":
        return kling_i2v(image_path, audio_path)
    return did_talks(image_path, audio_path)`}
        />
      </Section>

      <Section title="Шаблон 4: Video studio">
        <p>
          Пользователь вводит сценарий → LLM раскадровка → цикл keyframe + I2V → ffmpeg concat → один mp4. Долгий pipeline:
          используй <code>gr.Progress()</code> и промежуточные <code>gr.Gallery</code> для keyframe.
        </p>
        <Tbl
          head={['Виджет Gradio', 'Роль в studio']}
          rows={[
            ['gr.Textbox (lines=8)', 'Сценарий / тема ролика'],
            ['gr.Slider(2, 5)', 'Число сцен'],
            ['gr.Button + Progress', 'Запуск pipeline с tqdm в callback'],
            ['gr.Gallery', 'Промежуточные keyframe'],
            ['gr.Video', 'Финальный склеенный ролик'],
          ]}
        />
      </Section>

      <Section title="Паттерны Blocks, которые стоит запомнить">
        <ul>
          <li>
            <code>gr.State</code> — история чата и session id; не сбрасывается между кликами.
          </li>
          <li>
            <code>type="filepath"</code> для Audio/Image — pipeline получает путь, не numpy; проще отдать в API.
          </li>
          <li>
            Один <code>.click()</code> — одна pipeline-функция; не размазывай ASR и TTS по разным кнопкам без нужды.
          </li>
          <li>
            <code>demo.launch(server_name="0.0.0.0")</code> на RunPod; секреты только из <code>os.environ</code>.
          </li>
        </ul>
        <Callout type="tip">
          <p>
            Вынеси ASR, LLM, TTS в отдельные модули <code>audio_utils.py</code>, <code>brain.py</code> — Gradio-файл останется
            коротким, его же структуру перенесёшь в Project 5.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Project 5 сдаётся с Gradio или Streamlit UI. Минимум: текст + голосовой ввод, ответ текстом и аудио, опционально video
          avatar. Возьми шаблон 1 или 2 из week 19 и добавь MCP tools — не переписывай UI с нуля.
        </p>
      </ProjectNote>

      <KeyIdea>
        Gradio Blocks — витрина, pipeline-функция — кухня. Четыре шаблона week 19: ASR→VLM→TTS, TTS→D-ID, ElevenLabs+Kling,
        video studio. Держи модальности в функциях, UI только маршрутизирует inputs/outputs.
      </KeyIdea>
    </>
  )
}

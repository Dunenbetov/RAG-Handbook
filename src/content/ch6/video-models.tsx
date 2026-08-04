import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { CostRouteDashboard } from '../../components/interactive/CostRouteDashboard'

export default function Lesson() {
  return (
    <>
      <Section title="Text-to-Video vs Image-to-Video">
        <p>
          Генерация видео — самая дорогая модальность в агенте. Два режима задают и промпт, и бюджет:
        </p>
        <Tbl
          head={['Режим', 'Вход', 'Когда использовать']}
          rows={[
            ['T2V (Text-to-Video)', 'Только текстовый промпт', 'Сценарий с нуля, абстрактные сцены, заставки'],
            ['I2V (Image-to-Video)', 'Keyframe-картинка + motion prompt', 'Контроль композиции: сначала diffusion-keyframe, потом «оживление»'],
          ]}
        />
        <CostRouteDashboard />
        <p>
          Дашборд выше — учебная модель routing: tier budget/balanced/premium и лимит клипов на сессию. В проде те же решения
          принимаешь кодом по бюджету пользователя.
        </p>
      </Section>

      <Section title="DiT: как устроены современные video-модели">
        <p>
          Большинство T2V/I2V моделей 2024–2026 (Wan, Kling, Veo, Sora-class) опираются на{' '}
          <strong>Diffusion Transformer (DiT)</strong>: вместо U-Net диффузия идёт через transformer-блоки на латентных
          патчах видео. Качество и цена растут с длительностью клипа и разрешением — учитывай <Term id="token">токены</Term> и
          лимиты API так же, как в текстовом Brain.
        </p>
        <Analogy>
          <p>
            Keyframe + I2V — как аниматору дать первый кадр раскадровки: модель «дорисовывает движение», а не придумывает сцену с
            нуля. Меньше сюрпризов с лицами и перспективой, выше шанс сдать проект с первого прогона.
          </p>
        </Analogy>
      </Section>

      <Section title="Wan, Kling, Veo — что выбрать на курсе">
        <Tbl
          head={['Модель', 'Доступ', 'Особенности']}
          rows={[
            ['Wan 2.1 / 2.2', 'Replicate, fal, локально (тяжёлый GPU)', 'Budget-tier, 5–10 сек клипы, хорош для черновиков'],
            ['Kling 2.1 / 2.5', 'fal.ai, официальный API', 'Balanced: lip-sync для avatar, I2V стабильнее Wan'],
            ['Google Veo 3', 'Vertex / Gemini API', 'Premium качество, дороже; Veo 3 Fast — компромисс скорость/цена'],
          ]}
        />
        <Callout type="info">
          <p>
            Для Project 5 avatar-видео чаще берут <strong>Kling Avatar</strong> или <strong>Creatify Aurora</strong> (photo + audio
            → talking head), а не чистый T2V — см. главу 7. T2V/I2V из этого урока — для video studio и бонусных сцен.
          </p>
        </Callout>
      </Section>

      <Section title="Replicate: poll loop для долгой генерации">
        <p>
          Video inference занимает 30–120 секунд. Replicate API асинхронный: создаёшь prediction, потом опрашиваешь статус.
        </p>
        <CodeBlock
          language="python"
          title="Replicate poll loop"
          code={`import replicate
import time

prediction = replicate.predictions.create(
    version="wan-video/wan-2.1-i2v-...",
    input={
        "prompt": "camera slowly pans across restaurant interior",
        "image": open("keyframe_01.png", "rb"),
        "duration": 5,
    },
)

while prediction.status not in ("succeeded", "failed", "canceled"):
    time.sleep(5)
    prediction.reload()

if prediction.status == "succeeded":
    video_url = prediction.output
else:
    raise RuntimeError(prediction.error)`}
        />
      </Section>

      <Section title="fal.ai: subscribe вместо poll">
        <p>
          <strong>fal_client.subscribe</strong> сам ждёт completion и возвращает результат — меньше boilerplate, удобно в Gradio.
        </p>
        <CodeBlock
          language="python"
          title="fal subscribe — Kling I2V"
          code={`import fal_client

result = fal_client.subscribe("fal-ai/kling-video/v2.1/standard/image-to-video", arguments={
    "prompt": "subtle head movement, natural blink, speaking to camera",
    "image_url": "https://your-cdn/keyframe.png",
    "duration": "5",
    "aspect_ratio": "16:9",
})
video_path = result["video"]["url"]`}
        />
      </Section>

      <Section title="Keyframe pipeline и ffmpeg concat">
        <Steps
          items={[
            {
              title: 'LLM пишет раскадровку',
              body: '3–5 сцен: текст промпта + длительность. Один сценарий — один JSON-массив для цикла генерации.',
            },
            {
              title: 'Text → Image (keyframe)',
              body: 'Diffusers / GPT-Image: один seed на сцену, единое разрешение 1280×720.',
            },
            {
              title: 'Image → Video (I2V)',
              body: 'Kling или Wan: motion prompt «slow zoom», 5 сек на клип.',
            },
            {
              title: 'Склейка ffmpeg',
              body: 'Скачиваешь mp4, concat demuxer склеивает клипы в финальный ролик.',
            },
          ]}
        />
        <CodeBlock
          language="bash"
          title="ffmpeg concat (файл list.txt: file 'clip1.mp4')"
          code={`# list.txt — по одной строке на клип:
# file 'scene_01.mp4'
# file 'scene_02.mp4'

ffmpeg -f concat -safe 0 -i list.txt -c copy output_final.mp4`}
        />
        <Callout type="warn">
          <p>
            Перекодирование (<code>-c:v libx264</code>) нужно только если клипы с разных моделей и у них разный codec. Если все
            mp4 с Kling — <code>-c copy</code> быстрее и без потери качества.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          На video studio week 19 лимитируй 2–3 клипа за демо — иначе счёт fal/Replicate съест весь бюджет за вечер. Сохраняй
          промпты и URL клипов в лог: перегенерация одной сцены дешевле, чем весь ролик заново.
        </p>
      </ProjectNote>

      <KeyIdea>
        T2V — с нуля по тексту, I2V — «оживление» keyframe. Wan/Kling/Veo — DiT-модели через Replicate (poll) или fal (subscribe).
        Production-пайплайн: раскадровка → keyframe → I2V → ffmpeg concat. Для avatar в Project 5 смотри I2V/lip-sync API, а не
        только T2V.
      </KeyIdea>
    </>
  )
}

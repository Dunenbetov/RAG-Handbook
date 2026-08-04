import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Четыре класса image-задач">
        <p>
          «Работа с картинками» — это не одна задача. На лекции выделяют <strong>четыре класса</strong> по направлению данных.
          Перепутать класс — значит вызвать diffusion там, где нужен <Term id="colpali">VLM</Term>, и получить мусор на выходе.
        </p>
        <Tbl
          head={['Класс', 'Вход → Выход', 'Пример use-case']}
          rows={[
            ['Image → Text', 'JPEG/PNG → описание, OCR, QA', '«Что на этом меню?», caption для accessibility'],
            ['Image + Text → Text', 'Картинка + вопрос → ответ', 'Vision-LLM: «Сколько калорий в этом блюде?»'],
            ['Text → Image', 'Промпт → новая картинка', 'Обложка, иллюстрация, keyframe для видео'],
            ['Image + Text → Image', 'Картинка + инструкция → правка', 'Inpaint, замена фона, LoRA-стиль персонажа'],
          ]}
        />
        <Analogy>
          <p>
            Image → Text — это экскурсовод, который описывает картину. Image + Text → Text — гид, которому можно задать вопрос
            про картину. Text → Image — художник с чистого холста. Image + Text → Image — реставратор, который меняет только
            указанную деталь.
          </p>
        </Analogy>
      </Section>

      <Section title="Image → Text и Image + Text → Text (VLM)">
        <p>
          <strong>Vision-Language Models (VLM)</strong> — те же <Term id="llm">LLM</Term>, но с энкодером изображения.
          GPT-4o, Gemini 2.5 Flash, Qwen2.5-VL принимают base64 или URL картинки вместе с текстом. Для Project 5 skill{' '}
          <code>analyze_restaurant_photo</code> — класс Image + Text → Text.
        </p>
        <CodeBlock
          language="python"
          title="Vision-запрос через OpenAI (Image + Text → Text)"
          code={`from openai import OpenAI
import base64

client = OpenAI()
with open("menu.jpg", "rb") as f:
    b64 = base64.standard_b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Перечисли блюда и цены. Только факты с фото."},
            {"type": "image_url", "image_url": {
                "url": f"data:image/jpeg;base64,{b64}",
                "detail": "low",   # дешевле: 512px, меньше vision-токенов
            }},
        ],
    }],
)
print(response.choices[0].message.content)`}
        />
        <Callout type="info">
          <p>
            Параметр <code>detail: low</code> — не «хуже качество ответа», а «меньше пикселей в vision-энкодер». Для меню,
            скриншотов и UI почти всегда хватает low; для мелкого текста на документе — <code>high</code>.
          </p>
        </Callout>
      </Section>

      <Section title="Text → Image: API и локальные пайплайны">
        <p>Генерация с нуля — <strong>diffusion</strong>-модели. Три рабочих маршрута на курсе:</p>
        <Steps
          items={[
            {
              title: 'GPT-Image / DALL·E (OpenAI)',
              body: 'Один HTTP-вызов, предсказуемое качество, дороже локального GPU. Хорош для прототипов и keyframe без возни с VRAM.',
            },
            {
              title: 'Gemini 2.0 Flash Image Generation',
              body: 'Нативная генерация в экосистеме Google; удобно, если Brain уже на Gemini. Промпт на русском работает стабильно.',
            },
            {
              title: 'Diffusers + ComfyUI (локально / RunPod)',
              body: 'Hugging Face Diffusers — Python API (Stable Diffusion, FLUX, SDXL). ComfyUI — node-граф для экспериментов с LoRA, ControlNet, inpaint без переписывания кода.',
            },
          ]}
        />
        <CodeBlock
          language="python"
          title="Diffusers: Text → Image (SDXL)"
          code={`from diffusers import StableDiffusionXLPipeline
import torch

pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
).to("cuda")

image = pipe(
    prompt="cozy restaurant interior, warm lighting, Almaty style",
    negative_prompt="blurry, text, watermark, deformed",
    num_inference_steps=30,
    guidance_scale=7.5,
).images[0]
image.save("keyframe_01.png")`}
        />
      </Section>

      <Section title="Image + Text → Image: edit, inpaint, LoRA">
        <p>
          Редактирование — отдельный API-класс: модель получает исходник и инструкцию «убери людей на заднем плане» или маску
          для inpaint. OpenAI <code>images.edit</code>, Gemini image editing, ComfyUI inpaint-ноды — один класс задач.
        </p>
        <p>
          <strong>LoRA</strong> — маленький адаптер поверх базовой diffusion: обучаешь на 10–30 фото персонажа или стиля,
          подключаешь в ComfyUI/Diffusers. Для курса достаточно понимать идею; полный fine-tune diffusion не требуется.
        </p>
      </Section>

      <Section title="Гиперпараметры diffusion">
        <Tbl
          head={['Параметр', 'Что делает', 'Практика']}
          rows={[
            ['guidance_scale', 'Насколько жёстко модель следует промпту (CFG)', '7–9 для SDXL; выше 12 — артефакты и «пережжённость»'],
            ['num_inference_steps', 'Число шагов дenoising', '20–40; больше 50 — медленнее, выигрыш минимален'],
            ['negative_prompt', 'Что модель должна избегать', '«blurry, watermark, extra fingers» — экономит перегенерации'],
            ['seed', 'Фиксация шума', 'Один seed + тот же промпт = воспроизводимый кадр для видео-keyframe'],
          ]}
        />
        <Callout type="warn" title="Частая ошибка">
          <p>
            Крутить <code>guidance_scale</code> до 20 «чтобы промпт точнее сработал» — типичный антипаттерн. Лучше переписать
            промпт и добавить negative_prompt, чем ломать CFG.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В Project 5 vision — Image + Text → Text (фото блюда → описание для агента). Генерация картинок опциональна для
          бонусов и video studio; если генерируешь keyframe для Kling — сохраняй seed и разрешение, которое принимает I2V-модель
          (часто 16:9, 1280×720).
        </p>
      </ProjectNote>

      <KeyIdea>
        Четыре класса image-задач задают выбор API: VLM для понимания, diffusion для создания и правки. GPT-Image и Gemini — быстрый
        старт; Diffusers и ComfyUI — контроль и LoRA. guidance_scale, steps и negative_prompt — первые ручки, которые крутишь при
        отладке генерации.
      </KeyIdea>
    </>
  )
}

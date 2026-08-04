import { Section } from '../../components/ui'
import { QuizBlock } from '../../components/QuizBlock'

const questions = [
  {
    q: 'Чем native multimodal модель принципиально отличается от pipeline-подхода?',
    options: [
      'Native multimodal не поддерживает текст — только аудио и видео',
      'Native принимает несколько модальностей в одном API-вызове; pipeline склеивает отдельные специализированные модели',
      'Pipeline быстрее всегда, потому что модели меньше',
      'Разницы нет — это маркетинговые названия одного и того же',
    ],
    answer: 1,
    explain:
      'Native (GPT-4o, Gemini, Qwen Omni) обрабатывает модальности внутри одной модели. Pipeline — ASR, LLM, TTS, video как отдельные сервисы, связанные кодом. В курсе pipeline даёт контроль и экономию; native — меньше склеек, но дороже и сложнее отладка по шагам.',
  },
  {
    q: 'Какой класс image-задачи описывает skill analyze_restaurant_photo в Project 5?',
    options: [
      'Text → Image (генерация)',
      'Image → Text (только caption)',
      'Image + Text → Text (VLM: фото + вопрос → ответ)',
      'Image + Text → Image (inpaint)',
    ],
    answer: 2,
    explain:
      'Агент получает фото блюда и текстовый контекст/вопрос, VLM возвращает текстовое описание или анализ. Это класс Image + Text → Text. Генерация и inpaint — другие классы с diffusion-моделями.',
  },
  {
    q: 'Зачем в vision-запросе GPT-4o ставить detail: low и ресайзить картинку до 1024px?',
    options: [
      'Чтобы модель «хуже видела» и меньше галлюцинировала',
      'Чтобы снизить число vision-токенов и стоимость запроса при достаточном качестве для меню/фото блюд',
      'Потому что API не принимает изображения больше 512px',
      'Только для PNG — JPEG нельзя отправлять в high detail',
    ],
    answer: 1,
    explain:
      'Vision-токены считаются от разрешения. detail:low и resize уменьшают счёт в 3–5 раз для типичных food photo без потери полезности. High detail нужен для мелкого OCR, не для обычного анализа блюда.',
  },
  {
    q: 'ASR, diarization и TTS — как они соотносятся с Brain в pipeline-агенте?',
    options: [
      'Все три — части Brain, LLM не нужен',
      'ASR и TTS до и после Brain; Brain работает с текстом; diarization нужна, когда несколько спикеров',
      'TTS стоит до ASR, чтобы улучшить распознавание',
      'Diarization заменяет Whisper полностью',
    ],
    answer: 1,
    explain:
      'ASR переводит аудио пользователя в текст для LLM. LLM (Brain) генерирует текстовый ответ. TTS озвучивает ответ. Diarization — опциональный шаг «кто говорил», нужен для multi-speaker, не для одиночного голосового бота.',
  },
  {
    q: 'T2V vs I2V: когда I2V предпочтительнее для video studio?',
    options: [
      'I2V всегда дешевле T2V при любом промпте',
      'Когда нужен контроль композиции: сначала keyframe (Text→Image), затем «оживление» картинки motion prompt',
      'I2V не требует промпта — только картинку',
      'T2V даёт lip-sync, I2V — нет',
    ],
    answer: 1,
    explain:
      'I2V (Image-to-Video) фиксирует первый кадр через diffusion-keyframe, модель добавляет движение. Меньше сюрпризов с лицами и ракурсом, чем T2V с нуля. Lip-sync для avatar — отдельные API (Kling Avatar, D-ID), не чистый T2V.',
  },
  {
    q: 'Какой паттерн Gradio рекомендуется для мультимодального агента week 19?',
    options: [
      'Отдельная кнопка на каждый API — ASR, LLM, TTS, Video независимо',
      'gr.Blocks + одна pipeline-функция: inputs виджетов → ASR/LLM/TTS/avatar → outputs',
      'Только gr.ChatInterface — другие модальности не поддерживаются',
      'Pipeline пишется в CSS, логика — в HTML',
    ],
    answer: 1,
    explain:
      'Gradio Blocks с одной pipeline-функцией отделяет UI от логики: mic/image на входе, text/audio/video на выходе. Внутри функции — последовательность ASR → Brain → TTS → avatar. Так проще менять провайдера без переписывания UI.',
  },
]

export default function Lesson() {
  return (
    <Section title="Проверь себя: мультимодальность и пайплайны">
      <p>
        Шесть вопросов про карту модальностей, image-классы, audio/video API и Gradio. Если сомневаешься — вернись к урокам про
        native vs pipeline, detail:low и шаблоны week 19.
      </p>
      <QuizBlock id="ch6" questions={questions} />
    </Section>
  )
}

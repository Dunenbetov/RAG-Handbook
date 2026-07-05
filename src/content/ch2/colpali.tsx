import { Analogy, Callout, KeyIdea, No, ProjectNote, Section, Steps, VS, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="А что, если вообще не парсить PDF?">
        <p>
          Вся наша боль с таблицами происходит из одного шага: превращения PDF в текст. Колонки перемешиваются, таблицы
          рвутся, диаграммы исчезают. <Term id="colpali">ColPali</Term> (и его наследник ColQwen2) предлагает радикальное
          решение: <strong>не превращать</strong>. Работать с изображениями страниц напрямую — ведь современные vision-модели
          «видят» таблицы и графики так же, как человек.
        </p>
        <Analogy>
          <p>
            Обычный RAG — как пересказывать другу схему проезда по телефону: «потом налево, потом вроде направо…» — половина
            деталей теряется в пересказе. ColPali — как отправить скриншот карты: друг сам увидит всё, что нужно. Пересказ
            (парсинг) больше не является узким местом.
          </p>
        </Analogy>
      </Section>

      <Section title="Как это работает: multi-vector и MaxSim">
        <Steps
          items={[
            { title: 'Страница → изображение', body: 'PDF рендерится в картинки постранично (100–200 DPI). Никакого OCR и извлечения текста.' },
            { title: 'Изображение → сетка патчей → векторы', body: 'Vision-модель делит страницу на патчи (маленькие квадраты) и кодирует каждый в свой вектор. Одна страница = не один вектор, а десятки (multi-vector) — сохраняется информация о том, ГДЕ на странице что находится.' },
            { title: 'Поиск через MaxSim', body: 'Для каждого токена запроса находится самый похожий патч страницы, эти максимумы суммируются. Запрос «выручка 2024» сматчится с конкретной ячейкой таблицы, даже если остальная страница о другом.' },
          ]}
        />
        <VS
          left={{
            title: 'Классический пайплайн',
            tone: 'neutral',
            children: <p>PDF → парсер → текст → чанки → эмбеддинги. Каждый шаг теряет информацию; таблицы и графики страдают первыми.</p>,
          }}
          right={{
            title: 'ColPali',
            tone: 'neutral',
            children: <p>PDF → изображения страниц → multi-vector эмбеддинги. Ничего не теряется: модель видит страницу как есть, вместе с вёрсткой, таблицами и диаграммами.</p>,
          }}
        />
      </Section>

      <Section title="Код: демо с лекции (Air Astana Annual Report)">
        <CodeBlock
          language="python"
          title="colpali_demo.py"
          code={`import torch
from colpali_engine.models import ColQwen2, ColQwen2Processor

model = ColQwen2.from_pretrained("vidore/colqwen2-v1.0",
                                 torch_dtype=torch.bfloat16, device_map="auto")
processor = ColQwen2Processor.from_pretrained("vidore/colqwen2-v1.0")

# 1. Страницы отчёта → изображения → multi-vector эмбеддинги
pages = pdf_pages_to_images("air_astana_report.pdf", pages=[3, 4, 6, 8], dpi=100)
indexed = []
for page in pages:
    batch = processor.process_images([page.image]).to(model.device)
    with torch.no_grad():
        embedding = model(**batch)          # N патчей × dim
    indexed.append({"embedding": embedding, "page": page.number})

# 2. Поиск: MaxSim между токенами запроса и патчами страниц
def search(query: str):
    batch_q = processor.process_queries([query]).to(model.device)
    with torch.no_grad():
        q_emb = model(**batch_q)
    scores = processor.score_multi_vector(q_emb, [p["embedding"] for p in indexed])
    return scores.argsort(descending=True)   # страницы по релевантности

# 3. Ответ: найденную страницу-КАРТИНКУ отдаём vision-LLM (gpt-4o)
best_page = search("финансовые показатели за 2024 год")[0]
answer = rag_answer_vision(query, page_image=pages[best_page].image)`}
        />
        <Callout type="info" title="Два режима ответа">
          <p>
            Найденную страницу можно либо распознать в текст и отдать обычной LLM, либо отправить <em>картинкой</em> в
            vision-модель (GPT-4o). Второй режим точнее на таблицах и графиках — модель видит структуру, а не пересказ.
          </p>
        </Callout>
      </Section>

      <Section title="Когда брать, когда нет">
        <ul>
          <li><Yes />Документы, где главное — таблицы, графики, диаграммы, сложная вёрстка</li>
          <li><Yes />Когда парсеры стабильно ломаются на твоих PDF</li>
          <li><No />Нужен GPU: инференс vision-модели на CPU мучителен</li>
          <li><No />Хранение дороже: десятки векторов на страницу вместо одного на чанк</li>
          <li><No />Гибридный поиск с BM25 не сделаешь — текста-то нет</li>
        </ul>
      </Section>

      <ProjectNote>
        <p>
          В Project 4 ColPali не обязателен — там ставка на Visual Layout парсинг (Docling/Unstructured). Но упомянуть его в
          итоговом выводе как альтернативный путь для «нерешаемых» вопросов по таблицам — сильный ход, показывающий кругозор.
          На семинаре недели 12 применялся родственный приём: страницы с графиками прогонялись через GPT-4o (vision) для
          извлечения структурированного текста — это доступно и без GPU.
        </p>
      </ProjectNote>

      <KeyIdea>
        ColPali выкидывает самый хрупкий этап пайплайна — парсинг: страницы индексируются как изображения через multi-vector
        эмбеддинги и MaxSim-скоринг. Таблицы и графики перестают теряться, но цена — GPU и тяжёлое хранилище.
      </KeyIdea>
    </>
  )
}

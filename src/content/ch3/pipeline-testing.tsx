import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Зачем тестировать этапы по отдельности">
        <p>
          RAGAS оценивает систему целиком — это взгляд «с конца». Но у него есть слепое пятно: если PDF-парсер потерял
          таблицу с финансовыми показателями, ты увидишь низкий <Term id="context-recall">Context Recall</Term> и пойдёшь
          менять embedding-модель... а виноват парсер, отработавший за три этапа до поиска. Ошибка на раннем этапе{' '}
          <strong>отравляет всё ниже по течению</strong>, и по end-to-end метрикам её источник не виден.
        </p>
        <Analogy>
          <p>
            Пекарня, где хлеб выходит горьким. Можно бесконечно ругать пекаря и крутить температуру печи — а можно
            проверить каждый этап конвейера отдельно: попробовать муку на складе, тесто после замеса, заготовку перед
            печью. Если горчит уже мука — печь ни при чём. Контроль качества ставят <em>на каждом этапе конвейера</em>,
            а не только на выходе.
          </p>
        </Analogy>
        <p>
          В этом уроке — три техники поэтапного контроля: валидация парсинга через Visual LLM и два способа оценить
          качество чанков.
        </p>
      </Section>

      <Section title="Техника 1: валидация парсинга через Visual LLM">
        <p>
          Как понять, что парсер вытащил из PDF всё и ничего не переврал? Сравнивать с «правильным» текстом не выйдет — его
          нет (иначе зачем парсер?). Трюк: у нас есть идеальный источник правды — <strong>сама страница как
          картинка</strong>. Рендерим страницу PDF в PNG, даём мультимодальной модели картинку + извлечённый текст и просим
          оценить, насколько текст соответствует изображению.
        </p>
        <CodeBlock
          language="python"
          title="validate_extraction.py"
          code={`import fitz  # PyMuPDF
import base64, json

def render_page(pdf_path: str, page_num: int) -> str:
    doc = fitz.open(pdf_path)
    pix = doc[page_num].get_pixmap(dpi=200)  # 200 dpi хватает, чтобы судья читал мелкий текст
    return base64.b64encode(pix.tobytes("png")).decode()

VALIDATION_PROMPT = """Ты проверяешь качество извлечения текста из PDF.
На изображении — оригинальная страница. Ниже — текст, извлечённый парсером.
Оцени каждый пункт от 1 до 5 и верни строго JSON:
{"headings_score": ..., "tables_score": ..., "text_completeness": ...,
 "formatting_score": ..., "overall": ..., "issues": ["список проблем"]}

Извлечённый текст:
"""

def validate_extraction(pdf_path, page_num, extracted_text):
    image_b64 = render_page(pdf_path, page_num)
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": VALIDATION_PROMPT + extracted_text},
                {"type": "image_url",
                 "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
            ],
        }],
    )
    return json.loads(response.choices[0].message.content)`}
        />
        <VS
          left={{
            title: 'Хороший парсер (layout-aware)',
            tone: 'good',
            children: (
              <p>
                Все оценки — 5: заголовки на месте, таблица превратилась в аккуратный markdown, текст полный.{' '}
                <code>issues: []</code>.
              </p>
            ),
          }}
          right={{
            title: 'Плохой парсер',
            tone: 'bad',
            children: (
              <p>
                <code>tables_score: 1</code> — таблица с показателями рассыпалась в кашу из чисел или потерялась целиком.{' '}
                <code>issues: ["таблица на стр. 47 не извлечена"]</code>.
              </p>
            ),
          }}
        />
        <Callout type="tip" title="Главный плюс метода">
          <p>
            <strong>Не нужен ground truth.</strong> Никто не размечал «правильный текст страницы» — источником правды служит
            сама картинка. Метод работает на любом документе из коробки.
          </p>
        </Callout>
      </Section>

      <Section title="Техника 2: Semantic Coherence — чанк об одном или «каша»?">
        <p>
          Дальше по конвейеру — чанкинг. Хороший <Term id="chunk">чанк</Term> рассказывает об одной теме; плохой склеивает
          хвост одного раздела с началом другого. Дешёвый способ это измерить —{' '}
          <Term id="semantic-coherence">semantic coherence</Term>: берём эмбеддинг каждого предложения чанка, считаем
          попарные косинусные сходства и смотрим на их уровень и разброс (дисперсию).
        </p>
        <CodeBlock
          language="python"
          title="coherence.py"
          code={`import numpy as np
from itertools import combinations

def semantic_coherence(chunk_text: str) -> float:
    sentences = split_sentences(chunk_text)
    if len(sentences) < 2:
        return 1.0
    embs = embed(sentences)  # эмбеддинг каждого предложения
    sims = [cos_sim(a, b) for a, b in combinations(embs, 2)]
    # низкая дисперсия + высокое среднее = чанк об одном
    return float(np.mean(sims))  # дополнительно смотри np.var(sims)`}
        />
        <p>
          Интерпретация: предложения одной темы лежат в векторном пространстве кучно — сходства высокие и ровные,
          coherence ≈ 0.97. Если в чанк попали конец главы про грузоперевозки и начало главы про кадровую политику —
          сходства проседают и скачут, coherence ≈ 0.82, дисперсия высокая. Метод <strong>быстрый и дешёвый</strong>
          (только эмбеддинги, ни одного LLM-вызова) — можно прогнать по всем чанкам базы. Но есть слабость: он не ловит{' '}
          <em>обрывы мысли</em> — чанк, начавшийся с середины предложения, может быть идеально «об одном».
        </p>
      </Section>

      <Section title="Техника 3: Context Independence — понятен ли чанк без соседей">
        <p>
          Вторая беда чанков: кусок вырван из документа и живёт один. Если он начинается со слов «Эта методика также
          применяется...» — читатель (и LLM!) не знает, какая «эта». Метрика{' '}
          <Term id="context-independence">context independence</Term> проверяет: понятен ли чанк <strong>без окружающего
          текста</strong>? Тут эмбеддингами не обойтись — нужен <Term id="llm-judge">LLM-судья</Term>.
        </p>
        <CodeBlock
          language="python"
          title="independence.py"
          code={`import random

INDEPENDENCE_PROMPT = """Оцени, понятен ли этот фрагмент текста сам по себе,
БЕЗ окружающего документа. Верни строго JSON:
{"score": 1-5,
 "has_dangling_references": true/false,  # «это», «они», «данный подход» без антецедента
 "starts_mid_sentence": true/false,
 "comment": "..."}

Фрагмент:
"""

# LLM на каждый чанк — дорого. Проверяем случайную выборку ~20%
sample = random.sample(chunks, k=max(1, int(len(chunks) * 0.2)))
reports = [judge(INDEPENDENCE_PROMPT + c.text) for c in sample]`}
        />
        <p>
          Флаги в ответе судьи — готовая диагностика: <code>has_dangling_references</code> значит, что в чанке висят «это»,
          «они», «данный показатель» без понятного антецедента; <code>starts_mid_sentence</code> — чанкер режет по
          символам, а не по границам предложений. Минус метода — цена: LLM-вызов на каждый чанк, поэтому проверяй
          случайную выборку около 20%, а не всю базу.
        </p>
      </Section>

      <Section title="Комбинированная стратегия">
        <p>Два метода дополняют друг друга — используем оба, но по-умному:</p>
        <Steps
          items={[
            {
              title: 'Coherence — на все чанки',
              body: 'Дёшево: только эмбеддинги. Получаем распределение скоров по всей базе и список подозрительных чанков с низкой связностью.',
            },
            {
              title: 'LLM-judge — на выборку и пограничные случаи',
              body: 'Случайные ~20% чанков плюс все, у кого coherence подозрительно низкий. Судья объяснит, что именно не так: обрыв, висячие ссылки, каша из тем.',
            },
            {
              title: 'Чиним чанкер, а не симптомы',
              body: 'Много starts_mid_sentence → режь по границам предложений/абзацев. Низкая coherence → уменьшай размер чанка или используй структуру документа (заголовки).',
            },
          ]}
        />
        <Tbl
          head={['Метод', 'Что ловит', 'Цена', 'Покрытие']}
          rows={[
            [
              <span key="c"><Term id="semantic-coherence">Semantic Coherence</Term></span>,
              '«Кашу» из нескольких тем в одном чанке',
              'Копейки (эмбеддинги)',
              'Все чанки',
            ],
            [
              <span key="i"><Term id="context-independence">Context Independence</Term></span>,
              'Обрывы мысли, висячие ссылки, старт с полуслова',
              'Дорого (LLM-вызов на чанк)',
              'Выборка ~20% + пограничные',
            ],
          ]}
        />
      </Section>

      <ProjectNote>
        <p>
          В Project 4 эти техники — твой аргумент в отчёте по заданию 1: прежде чем сравнивать retrieval-стратегии, покажи,
          что парсинг 368-страничного отчёта КТЖ не потерял таблицы (Visual LLM-валидация на нескольких страницах с
          таблицами), а чанки — связные и самодостаточные. Такой поэтапный контроль качества жюри ценит: он показывает, что
          ты понимаешь, где пайплайн может сломаться.
        </p>
      </ProjectNote>

      <KeyIdea>
        Ошибка раннего этапа отравляет всё ниже по течению, а end-to-end метрики не покажут её источник — поэтому тестируй
        этапы отдельно. Парсинг — Visual LLM против картинки страницы (не нужен ground truth). Чанки — дешёвая semantic
        coherence на всё + дорогой LLM-судья context independence на выборку. Дешёвый фильтр везде, дорогой судья — точечно.
      </KeyIdea>
    </>
  )
}

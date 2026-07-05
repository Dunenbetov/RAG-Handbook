import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Задача семинара: RAG-юрист">
        <p>
          Теория позади — соберём настоящий пайплайн, как на семинаре недели 11. Задача: бот, отвечающий на вопросы по{' '}
          <strong>Трудовому кодексу РК</strong> (trud.docx), опционально — ещё и по Уголовному (ugol.pdf). Проверка — 25
          вопросов трёх типов:
        </p>
        <ul>
          <li><strong>Точные:</strong> «Что говорит статья 52?», «Сколько дней отпуска по статье 88?»</li>
          <li><strong>Семантические:</strong> «Могут ли меня уволить, пока я на больничном?»</li>
          <li><strong>Каверзные:</strong> «Какое наказание за кражу?» — ответа в ТК нет, бот должен честно сказать «не знаю» (или замаршрутизировать вопрос в УК).</li>
        </ul>
      </Section>

      <Section title="Ключевое решение: чанк = статья кодекса">
        <p>
          Юридический документ имеет идеальную природную структуру — статьи. Вместо слепой нарезки по 500 символов семинар
          использует document-based чанкинг: одна статья = один чанк, с номером и названием в{' '}
          <Term id="metadata">метаданных</Term>.
        </p>
        <CodeBlock
          language="python"
          title="parse_codex.py — парсинг статей регуляркой"
          code={`import re
from docx import Document

doc = Document("trud.docx")
full_text = "\\n".join(p.text for p in doc.paragraphs)

# «Статья 52. Расторжение трудового договора...» → (52, название)
pattern = r"Статья (\\d+)\\. (.+)"
articles = []

for match in re.finditer(pattern, full_text):
    num, title = match.group(1), match.group(2)
    articles.append({
        "text": extract_article_body(full_text, match),
        "metadata": {
            "article_num": int(num),
            "title": title.strip(),
            "source": "ТК РК",
        },
    })

print(f"Извлечена {len(articles)} статья")   # 141 статья`}
        />
        <Callout type="tip">
          <p>
            Если статья длиннее ~1500 символов — её делят на части, но <strong>заголовок статьи дублируют в каждой части</strong>.
            Иначе кусок «…work уведомить за месяц…» без заголовка превращается в бессмысленный обрывок. Запомни этот приём — в
            Project 4 он обязателен для таблиц.
          </p>
        </Callout>
        <Analogy>
          <p>
            Это как раскладывать аптечку: можно свалить все таблетки в одну кучу и резать блистеры пополам (fixed-size), а
            можно хранить каждое лекарство в своей коробочке с этикеткой (чанк-статья с метаданными). Когда срочно нужен
            «анальгин, статья 52» — разница очевидна.
          </p>
        </Analogy>
      </Section>

      <Section title="Сборка пайплайна">
        <Steps
          items={[
            { title: 'Парсинг', body: 'python-docx + регулярка → 141 статья с метаданными (номер, название, глава).' },
            { title: 'Чанкинг', body: 'Статья = чанк; длинные статьи делятся с сохранением заголовка. Альтернатива семинара на LlamaIndex: SentenceSplitter(chunk_size=1000, chunk_overlap=200) → 184 чанка из двух кодексов.' },
            { title: 'Эмбеддинги', body: 'intfloat/multilingual-e5-large с префиксами query:/passage: (или text-embedding-3-small через API).' },
            { title: 'Индексация', body: 'ChromaDB, метрика cosine, метаданные для фильтров.' },
            { title: 'Retrieval + генерация', body: 'Top-5 чанков → промпт юриста → GPT-4o-mini.' },
            { title: 'Оценка', body: '25 вопросов; на 10 размеченных — Hit Rate@5 = 0.9, MRR = 0.78.' },
          ]}
        />
        <CodeBlock
          language="python"
          title="query_engine.py — промпт и два режима поиска (LlamaIndex)"
          code={`SYSTEM_PROMPT = """
Ты — юридический ассистент по законодательству Республики Казахстан.

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе предоставленного контекста
2. Если информации нет в контексте — честно скажи об этом
3. Ссылайся на конкретные статьи из контекста
4. Указывай источник (УК РК или ТК РК) при цитировании

КОНТЕКСТ: {context_str}
ВОПРОС: {query_str}
ОТВЕТ:
"""

# Семинар держит ДВА ретривера и позволяет их сравнивать:
semantic_retriever = index.as_retriever(similarity_top_k=5)      # вектор
bm25_retriever = BM25Retriever.from_defaults(docstore=docstore,  # ключевые слова
                                             similarity_top_k=5)

def ask(question: str, mode: str = "semantic"):
    engine = semantic_engine if mode == "semantic" else bm25_engine
    return engine.query(question)

ask("Что такое трудовой договор?")            # → semantic справляется
ask("Статья 150 УК РК", mode="bm25")          # → тут нужен bm25`}
        />
      </Section>

      <Section title="Результаты и мораль">
        <Tbl
          head={['Тип вопроса', 'Semantic', 'BM25', 'Победитель']}
          rows={[
            ['«Что говорит статья 52?»', 'Нашёл статьи 50, 53, 54 — мимо!', 'Статья 52 первой строкой', 'BM25'],
            ['«Могут ли уволить на больничном?»', 'Нашёл нужные статьи по смыслу', 'Не нашёл: слова «уволить» нет в кодексе', 'Semantic'],
            ['«Какое наказание за кражу?»', 'Честное «в ТК ответа нет» (если промпт хороший)', 'То же', 'Ничья — нужен роутинг в УК'],
          ]}
        />
        <p>
          Вывод семинара, который станет главной темой недели 12: <strong>ни один метод поиска не побеждает всегда</strong>.
          Точные вопросы требуют BM25, смысловые — векторов, а вопросы «не в ту базу» — маршрутизации. Всё это и есть
          Advanced RAG.
        </p>
      </Section>

      <ProjectNote>
        <p>
          Семинар недели 11 — это мини-версия Project 4: тот же конвейер, только вместо кодексов — годовые отчёты со сложной
          вёрсткой, вместо регулярки — Docling/Unstructured, а вместо ручной оценки — RAGAS. Если понял этот урок — половина
          части A задания 1 у тебя в голове уже есть.
        </p>
      </ProjectNote>

      <KeyIdea>
        Реальный пайплайн начинается с уважения к структуре документа: чанк-статья с метаданными бьёт слепую нарезку. А
        сравнение semantic vs BM25 на живых вопросах доказывает: одного метода поиска мало — нужен гибрид.
      </KeyIdea>
    </>
  )
}

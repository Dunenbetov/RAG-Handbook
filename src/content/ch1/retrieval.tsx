import { Brain, Type } from 'lucide-react'
import { Analogy, Callout, Formula, KeyIdea, No, ProjectNote, Section, VS, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { HybridSearchDemo } from '../../components/interactive/HybridSearchDemo'

export default function Lesson() {
  return (
    <>
      <Section title="Сердце RAG">
        <p>
          <Term id="retrieval">Retrieval</Term> — этап, на котором решается судьба всего ответа. Если поиск не принёс нужный
          чанк, LLM <em>физически не может</em> ответить правильно: либо честно скажет «в контексте нет ответа», либо
          сгаллюцинирует. Никакая генерация не исправит плохой поиск.
        </p>
        <p>Есть два принципиально разных способа искать — и у каждого свои слепые зоны.</p>
      </Section>

      <Section title="Dense vs Sparse: смысл против слов">
        <VS
          left={{
            title: <span className="inline-flex items-center gap-1.5"><Brain className="size-4 text-accent" /> Dense Retrieval (векторный)</span>,
            tone: 'neutral',
            children: (
              <>
                <p>Ищет по смыслу через эмбеддинги: вопрос → вектор → ближайшие чанки.</p>
                <ul>
                  <li><Yes />Парафразы: «могут ли уволить на больничном» найдёт «расторжение договора в период нетрудоспособности»</li>
                  <li><Yes />Синонимы и концептуальные вопросы</li>
                  <li><No />Точные номера: «статья 52» почти неотличима от «статьи 53» в векторном пространстве</li>
                  <li><No />Названия, аббревиатуры, артикулы</li>
                </ul>
              </>
            ),
          }}
          right={{
            title: <span className="inline-flex items-center gap-1.5"><Type className="size-4 text-warn" /> Sparse Retrieval (BM25)</span>,
            tone: 'neutral',
            children: (
              <>
                <p>Ищет точные слова — как Ctrl+F с умным ранжированием (TF-IDF-семейство).</p>
                <ul>
                  <li><Yes />Номера статей, точные названия («Достык – Мойынты»), цифры</li>
                  <li><Yes />Термины и аббревиатуры</li>
                  <li><No />Синонимы: «увольнение» и «расторжение договора» — разные слова, связи нет</li>
                  <li><No />Переформулированные вопросы</li>
                </ul>
              </>
            ),
          }}
        />
        <Analogy>
          <p>
            Dense — это начитанный друг: спроси своими словами, он поймёт о чём ты, но переврёт номер статьи. BM25 — это
            указатель в конце книги: найдёт точное слово мгновенно, но если ты назвал вещь по-другому — разведёт руками.
            Хороший юрист пользуется обоими.
          </p>
        </Analogy>
        <p>
          Реальный случай с семинара недели 11: на вопрос <em>«Что говорит статья 52?»</em> чистый векторный поиск вернул
          статьи 50, 53 и 54 — но не 52! Числа плохо кодируются эмбеддингами. BM25 находит статью 52 первым же результатом.
        </p>
      </Section>

      <Section title="Hybrid Search: берём лучшее от обоих">
        <p>
          <Term id="hybrid-search">Гибридный поиск</Term> запускает оба метода и смешивает результаты с весом{' '}
          <Term id="alpha">α</Term>:
        </p>
        <Formula note="α = 1 — только векторы, α = 0 — только BM25, 0.5 — поровну. Стартовое значение для продакшна — 0.5.">
          score = α · dense_score + (1 − α) · sparse_score
        </Formula>
        <p>
          Ниже — живое демо на статьях кодекса. Попробуй оба запроса и подвигай α: увидишь, что точный запрос «статья 52»
          вытягивает BM25 (α ближе к 0), а парафраз про увольнение — векторы (α ближе к 1). Гибрид с α = 0.5 хорош в обоих
          случаях — за это его и любят.
        </p>
        <HybridSearchDemo />
      </Section>

      <Section title="Код: retriever в LangChain и hybrid в Pinecone">
        <CodeBlock
          language="python"
          title="retrieval.py"
          code={`# Dense retriever из векторной базы (LangChain)
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4},          # top-k чанков
)

# MMR — вариант с разнообразием результатов:
# сначала достаём fetch_k кандидатов, из них выбираем k непохожих друг на друга
mmr_retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.7},
)

# Hybrid search (Pinecone + BM25), демо с лекции
from langchain_community.retrievers import PineconeHybridSearchRetriever
from pinecone_text.sparse import BM25Encoder

bm25_encoder = BM25Encoder().default()
bm25_encoder.fit(texts)              # BM25 обучается на твоём корпусе!

hybrid = PineconeHybridSearchRetriever(
    embeddings=embeddings,
    sparse_encoder=bm25_encoder,
    index=index,                     # Pinecone-индекс с metric="dotproduct"
    top_k=5,
    alpha=0.5,                       # баланс vector/BM25
)`}
        />
        <Callout type="info" title="Про MMR">
          <p>
            MMR (Maximum Marginal Relevance) — полезный трюк, когда top-k забивается почти одинаковыми чанками: он
            балансирует релевантность и разнообразие (lambda_mult: 1 — только релевантность, 0 — максимум разнообразия).
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          В Project 4 hybrid search <strong>обязателен</strong> (задание 1B), причём объединять результаты нужно через RRF —
          о нём подробно в главе 2. А alpha — один из самых показательных гиперпараметров экспериментов: ТЗ прямо просит
          прогнать α от 0.0 до 1.0 и объяснить, где оптимум и почему. Тест-маркер: вопрос про «Достык – Мойынты» из golden
          dataset без BM25 почти не решается.
        </p>
      </ProjectNote>

      <KeyIdea>
        Dense ищет смысл, но слепнет на числах и названиях; BM25 ищет слова, но не знает синонимов. Hybrid с α ≈ 0.5 закрывает
        слепые зоны обоих — это золотой стандарт продакшна и обязательное требование Project 4.
      </KeyIdea>
    </>
  )
}

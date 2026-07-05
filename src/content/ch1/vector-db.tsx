import { Analogy, Callout, Fav, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Долговременная память для ИИ">
        <p>
          Эмбеддинги посчитаны — теперь их нужно где-то хранить и, главное, <strong>быстро искать</strong>. «Быстро» — это
          найти ближайшие векторы к запросу среди миллионов за миллисекунды. Обычные базы данных так не умеют: им нужен
          точный ключ, а у нас — «найди самое похожее».
        </p>
        <p>
          <Term id="vector-db">Векторная база данных</Term> решает ровно эту задачу: хранит векторы вместе с текстами и{' '}
          <Term id="metadata">метаданными</Term>, строит специальные индексы и отвечает на запрос «top-k ближайших» почти
          мгновенно.
        </p>
      </Section>

      <Section title="Почему нельзя просто перебрать все векторы">
        <p>
          Наивный поиск — сравнить запрос с каждым вектором базы — это O(n). На тысяче чанков сработает, на десяти миллионах
          — уже секунды на каждый запрос. Поэтому векторные базы используют{' '}
          <Term id="ann">ANN</Term> (Approximate Nearest Neighbor) — приближённый поиск: чуть-чуть жертвуем идеальной
          точностью, зато получаем O(log n).
        </p>
        <p>Главный алгоритм — <Term id="hnsw">HNSW</Term> (Hierarchical Navigable Small World):</p>
        <Analogy title="Аналогия: перелёт вместо пешей прогулки">
          <p>
            Как добраться из Алматы в конкретный двор Астаны? Не идти пешком, проверяя каждый дом (полный перебор). Сначала —
            самолёт до города (верхний слой графа HNSW: мало узлов, длинные «магистральные» связи), потом такси до района
            (средний слой), потом пешком до двора (нижний слой: все узлы, короткие связи). HNSW строит такую многослойную
            «транспортную сеть» над векторами: сверху вниз, большими прыжками — к цели.
          </p>
        </Analogy>
        <p>
          Второй популярный подход — IVF (Inverted File Index): пространство заранее разбивается на кластеры, и поиск идёт
          только внутри нескольких ближайших кластеров. HNSW используется в ChromaDB, Qdrant и pgvector.
        </p>
      </Section>

      <Section title="Кого выбрать: обзор рынка">
        <Tbl
          head={['База', 'Тип', 'Кому подходит']}
          rows={[
            ['ChromaDB', 'Embedded (pip install)', <span key="c"><Fav />Прототипы, пет-проекты, учебные задачи — заводится за минуту</span>],
            ['Pinecone', 'Облако (SaaS)', '«Apple мира векторных БД»: всё работает само, но платно; есть hybrid search'],
            ['Qdrant', 'Open source (Rust) + Cloud', 'Продакшн: скорость, богатые фильтры по метаданным'],
            ['Weaviate', 'Open source + Cloud', 'Модульность, GraphQL, умеет сам векторизовать'],
            ['FAISS', 'Библиотека (Meta)', 'Максимальная скорость, без сервера — исследования и кастомные решения'],
            ['pgvector', 'Расширение Postgres', 'Когда данные уже в Postgres и хочется SQL + векторы вместе'],
          ]}
        />
        <Callout type="tip">
          <p>
            Правило курса: <strong>ChromaDB для прототипов, Qdrant/Pinecone для продакшна</strong>. Для учебного проекта
            ChromaDB — идеальный выбор: никакой настройки, персистентность в локальную папку, HNSW из коробки.
          </p>
        </Callout>
      </Section>

      <Section title="ChromaDB за 60 секунд">
        <CodeBlock
          language="python"
          title="vector_store.py — полный цикл работы с ChromaDB"
          code={`import chromadb

# Persistent: данные переживут перезапуск (лежат в ./chroma_db)
client = chromadb.PersistentClient(path="./chroma_db")

collection = client.create_collection(
    name="rag_documents",
    metadata={"hnsw:space": "cosine"},   # метрика — косинусное расстояние
)

# Добавляем чанки: тексты + векторы + метаданные + id
collection.add(
    documents=chunks,                     # тексты чанков
    embeddings=embeddings,                # их векторы
    metadatas=[{"source": "ktj.pdf", "page": 12}, ...],
    ids=[f"chunk_{i}" for i in range(len(chunks))],
)

# Поиск: top-5 ближайших к вектору вопроса
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=5,
    where={"source": "ktj.pdf"},          # фильтр по метаданным!
    include=["documents", "metadatas", "distances"],
)`}
        />
        <p>
          Обрати внимание на параметр <code>where</code> — фильтрация по метаданным. Она позволяет искать только в одном
          документе, только на определённых страницах или только в таблицах. Дёшево и мощно: половина «магии» продвинутых
          RAG-систем — это просто грамотные метаданные.
        </p>
      </Section>

      <ProjectNote>
        <p>
          Рекомендуемый стек ТЗ — ChromaDB (альтернативы: Qdrant, FAISS). Обязательно клади в метаданные источник
          (ktj.pdf / matnp_2024_rus.pdf) и страницу: golden dataset содержит поле file_source, и фильтрация по документу
          поможет и в отладке, и в Query Routing, если выберешь эту pre-retrieval технику.
        </p>
      </ProjectNote>

      <KeyIdea>
        Векторная база — это хранилище эмбеддингов с ANN-индексом (обычно HNSW), который находит ближайшие векторы за
        миллисекунды вместо полного перебора. ChromaDB закрывает учебные и прототипные задачи в три строчки кода; метаданные
        с фильтрами — недооценённая суперсила.
      </KeyIdea>
    </>
  )
}

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
        <p>
          У HNSW три ручки. Две задаются <strong>при построении</strong> индекса (поменять можно только перестройкой), одна
          — <strong>при запросе</strong>. Все три меняют один и тот же баланс: полнота поиска (recall) против скорости и
          памяти. Значения по умолчанию ниже — из pgvector.
        </p>
        <Tbl
          head={['Параметр', 'Когда', 'Что это', 'Больше значение →']}
          rows={[
            ['m (16)', 'Построение', 'Максимум связей у узла на слое графа', 'Выше recall, но больше памяти и медленнее построение'],
            ['ef_construction (64)', 'Построение', 'Сколько кандидатов держим, выбирая соседей нового узла', 'Качественнее граф и выше recall, медленнее построение и вставка; в pgvector нужно ef_construction ≥ 2·m'],
            ['ef_search (40)', 'Запрос', 'Сколько кандидатов держим при поиске', 'Выше recall, медленнее запрос; в pgvector меняется на лету: SET hnsw.ef_search'],
          ]}
        />
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

      <Section title="pgvector: векторы прямо в Postgres">
        <p>
          Если Postgres уже есть в стеке, отдельная векторная база часто не нужна. Расширение pgvector добавляет тип{' '}
          <code>vector</code>, операторы расстояния (<code>{'<=>'}</code> — косинусное) и индексы HNSW и IVFFlat. Векторы
          лежат в той же транзакции и той же таблице, что и остальные данные, а фильтр по метаданным — обычный{' '}
          <code>WHERE</code>.
        </p>
        <CodeBlock
          language="sql"
          title="pgvector — таблица, HNSW-индекс и поиск с фильтром"
          code={`CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id         bigserial PRIMARY KEY,
  project_id int NOT NULL,
  content    text NOT NULL,
  embedding  vector(1536)          -- text-embedding-3-small
);

-- m и ef_construction фиксируются при построении индекса
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

SET hnsw.ef_search = 40;                  -- параметр запроса
SET hnsw.iterative_scan = strict_order;   -- pgvector >= 0.8, см. ниже

SELECT id, content, 1 - (embedding <=> $1) AS score   -- score = 1 − косинусное расстояние
FROM chunks
WHERE project_id = $2
ORDER BY embedding <=> $1
LIMIT 6;`}
        />
        <ul>
          <li>
            <strong>Лимиты размерности.</strong> Сам тип <code>vector</code> хранит до 16 000 измерений. Индексы HNSW и
            IVFFlat строятся только до 2000 измерений для <code>vector</code> и до 4000 для <code>halfvec</code>
            (половинная точность). Поэтому 1536 измерений индексируются как есть, а для 3072-мерного
            text-embedding-3-large нужен <code>halfvec</code> или урезанная размерность.
          </li>
          <li>
            <strong>Фильтр + ANN-индекс.</strong> При приближённом индексе <code>WHERE</code> применяется{' '}
            <em>после</em> обхода индекса. Если условию соответствует 10% строк, то при <code>ef_search = 40</code> в
            среднем останется около 4 результатов вместо запрошенных. С версии 0.8 это лечится iterative index scans (
            <code>hnsw.iterative_scan = strict_order | relaxed_order</code>): индекс дочитывается, пока не наберётся
            нужное число строк. Другие варианты: частичный индекс под частый фильтр или партиционирование.
          </li>
          <li>
            <strong>Маленький корпус.</strong> На сотнях строк планировщик Postgres может вообще не пойти в HNSW и выбрать
            последовательное сканирование, то есть точный перебор. Какой план выбран, покажет <code>EXPLAIN</code>.
          </li>
        </ul>
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

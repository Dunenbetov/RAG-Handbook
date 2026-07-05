import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { KnowledgeGraph } from '../../components/interactive/KnowledgeGraph'

export default function Lesson() {
  return (
    <>
      <Section title="Вопрос, на котором ломается обычный RAG">
        <p>
          «Кто инвестировал в компанию, разработавшую SmartCredit?» Простой вопрос — но для векторного RAG это ловушка.
          Ответ собирается из <strong>двух фактов из разных мест документа</strong>: (1) SmartCredit разработала компания
          «НейроТех», (2) в «НейроТех» инвестировал фонд MOST Ventures. Это{' '}
          <Term id="multi-hop">multi-hop</Term> вопрос: чтобы ответить, нужно сделать два «прыжка» по фактам.
        </p>
        <p>
          Обычному RAG нужно, чтобы <em>оба</em> факта случайно оказались в <Term id="top-k">top-k</Term> найденных чанков.
          Но чанк про инвестиции семантически не похож на вопрос про SmartCredit — слова «SmartCredit» в нём может вообще не
          быть. Поиск приносит половину пазла, и модель либо отвечает частично, либо галлюцинирует недостающее.
        </p>
        <p>
          <Term id="graphrag">GraphRAG</Term> решает это иначе: знания хранятся не как мешок чанков, а как{' '}
          <Term id="knowledge-graph">граф знаний</Term> — сущности (узлы) и связи между ними (рёбра). Тогда ответ — это
          просто прогулка по рёбрам: SmartCredit —DEVELOPED_BY→ НейроТех —INVESTED_IN_BY→ MOST Ventures. Никакого
          «повезёт/не повезёт»: связь между фактами хранится <em>явно</em>.
        </p>
        <Analogy>
          <p>
            Доска детектива из сериалов: фотографии подозреваемых, а между ними — красные нити «знаком с», «работал на»,
            «видели вместе». Детектив отвечает на вопрос «кто связан с ограблением?» не перечитыванием всех протоколов
            (вдруг нужные два окажутся рядом), а <em>движением по нитям</em>: от банка к охраннику, от охранника к его
            бывшему сокамернику. Векторный RAG — это стопка протоколов, GraphRAG — доска с нитями.
          </p>
        </Analogy>
        <p>
          Потрогай разницу руками: выбери вопрос и смотри, как подсвечивается путь обхода по графу. Обрати внимание, как с
          усложнением вопроса растёт число хопов — и как каждый хоп был бы отдельной «лотереей» для векторного поиска.
        </p>
        <KnowledgeGraph />
      </Section>

      <Section title="Пайплайн GraphRAG: из текста в граф">
        <Steps
          items={[
            {
              title: 'LLM извлекает сущности и связи',
              body: 'Модель читает текст и вытаскивает узлы по заданной схеме (Person, Organization, Product, Technology, Location, University, Department) и связи между ними (FOUNDED, CEO_OF, WORKS_AT, LEADS, DEVELOPED, USES_TECHNOLOGY, INVESTED_IN, LOCATED_IN, GRADUATED_FROM, PART_OF).',
            },
            {
              title: 'Entity resolution — дедупликация',
              body: '«НейроТех», «компания НейроТех» и «NeuroTech» — одна сущность, а не три узла. Без этого шага граф рассыпается на дубли, и путь обхода обрывается на полпути.',
            },
            {
              title: 'Загрузка в Neo4j',
              body: 'Узлы и рёбра складываются в графовую базу, узлы дополнительно получают эмбеддинги — они понадобятся для поиска точки входа.',
            },
            {
              title: 'Retrieval: вектор + обход графа',
              body: 'Вопрос → vector search по эмбеддингам узлов находит точку входа → обход графа на 1–2 хопа собирает соседей и связи.',
            },
            {
              title: 'Генерация по подграфу',
              body: 'LLM получает структурированный подграф (сущности + связи) и формулирует ответ — все звенья цепочки у неё перед глазами.',
            },
          ]}
        />
        <Callout type="warn" title="Entity resolution — критичный шаг">
          <p>
            <Term id="entity-resolution">Entity resolution</Term> — это склейка разных упоминаний одной сущности в один
            узел. Пропустишь его — получишь узел «НейроТех» со связью DEVELOPED и отдельный узел «компания НейроТех» со
            связью INVESTED_IN. Формально граф есть, но пути через него нет: multi-hop вопросы перестают работать, ради
            которых всё и затевалось.
          </p>
        </Callout>
      </Section>

      <Section title="Код: строим граф через SimpleKGPipeline">
        <p>
          Библиотека <code>neo4j-graphrag</code> собирает весь пайплайн построения графа в один класс. Обрати внимание на
          три вещи: temperature=0 и JSON-режим у LLM (извлечение должно быть структурированным и воспроизводимым), схема с{' '}
          <code>patterns</code> и флаг <code>perform_entity_resolution=True</code>.
        </p>
        <CodeBlock
          language="python"
          title="build_graph.py"
          code={`from neo4j import GraphDatabase
from neo4j_graphrag.llm import OpenAILLM
from neo4j_graphrag.embeddings import OpenAIEmbeddings
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline

driver = GraphDatabase.driver("neo4j://localhost:7687",
                              auth=("neo4j", "password123"))

llm = OpenAILLM(
    model_name="gpt-4o",
    model_params={"temperature": 0,
                  "response_format": {"type": "json_object"}},
)

schema = {
    "node_types": ["Person", "Organization", "Product", "Technology",
                   "Location", "University", "Department"],
    "relationship_types": ["FOUNDED", "CEO_OF", "WORKS_AT", "LEADS",
                           "DEVELOPED", "USES_TECHNOLOGY", "INVESTED_IN",
                           "LOCATED_IN", "GRADUATED_FROM", "PART_OF"],
    "patterns": [                       # какие связи между какими типами разрешены
        ("Person", "FOUNDED", "Organization"),
        ("Person", "CEO_OF", "Organization"),
        ("Organization", "DEVELOPED", "Product"),
        ("Organization", "INVESTED_IN", "Organization"),
        ("Product", "USES_TECHNOLOGY", "Technology"),
        # ...
    ],
}

kg_pipeline = SimpleKGPipeline(
    llm=llm,
    driver=driver,
    embedder=OpenAIEmbeddings(model="text-embedding-3-small"),
    schema=schema,
    perform_entity_resolution=True,  # склейка дублей сущностей
    on_error="IGNORE",               # не падать на одном неудачном куске текста
)

await kg_pipeline.run_async(text=document_text)`}
        />
        <p>
          Зачем нужны <code>patterns</code>? Они ограничивают фантазию LLM: без них модель может извлечь бессмысленную
          связь вида «Technology FOUNDED Organization» — технология основала компанию. Patterns — это whitelist: «связь
          FOUNDED допустима только из Person в Organization». Чем жёстче схема, тем чище граф.
        </p>
      </Section>

      <Section title="Cypher: язык вопросов к графу">
        <p>
          <Term id="neo4j">Neo4j</Term> опрашивается языком <Term id="cypher">Cypher</Term> — это как SQL, только вместо
          JOIN-ов ты буквально <em>рисуешь путь</em>: узлы в круглых скобках, связи — в квадратных, стрелки показывают
          направление.
        </p>
        <CodeBlock
          language="text"
          title="queries.cypher"
          code={`// Кто основал компании и что эти компании разработали
MATCH (p:Person)-[:FOUNDED]->(org:Organization)-[:DEVELOPED]->(prod:Product)
RETURN p.name, org.name, collect(prod.name)

// Кратчайший путь между двумя сущностями — «как связаны A и B?»
MATCH path = shortestPath(
  (a {name: "SmartCredit"})-[*]-(b {name: "MOST Ventures"})
)
RETURN path`}
        />
        <p>
          Первый запрос — это готовый двух-хоповый обход: человек → компания → продукт, одной строкой.{' '}
          <code>shortestPath</code> вообще магия для расследований: «найди, как связаны эти двое» — граф сам найдёт цепочку
          любой длины.
        </p>
      </Section>

      <Section title="Retrieval и генерация: VectorCypherRetriever + GraphRAG">
        <p>
          Осталось собрать «поисковую» часть. <code>VectorCypherRetriever</code> работает в два такта: сначала vector search
          по эмбеддингам узлов находит точку входа в граф, потом твой Cypher-запрос из <code>retrieval_query</code>{' '}
          раскрывает окрестность найденного узла — соседей и связи на 1–2 хопа.
        </p>
        <CodeBlock
          language="python"
          title="graph_retrieval.py"
          code={`from neo4j_graphrag.retrievers import VectorCypherRetriever
from neo4j_graphrag.generation import GraphRAG

retriever = VectorCypherRetriever(
    driver,
    index_name="entity_embeddings",   # векторный индекс по эмбеддингам узлов
    retrieval_query="""
    MATCH (node)-[r]->(neighbor)
    RETURN node.name AS entity, type(r) AS rel, neighbor.name AS neighbor
    """,
    embedder=embedder,
)

rag = GraphRAG(retriever=retriever, llm=llm)
result = rag.search(
    query_text="Кто инвестировал в компанию, разработавшую SmartCredit?",
    retriever_config={"top_k": 5},
)
print(result.answer)
# → "В НейроТех, разработчика SmartCredit, инвестировал фонд MOST Ventures."`}
        />
      </Section>

      <Section title="Стоит ли оно того? Сравнение и границы применимости">
        <p>Результат сравнения с лекции — GraphRAG против Naive RAG на одном и том же корпусе:</p>
        <Tbl
          head={['Тип вопроса', 'Naive RAG', 'GraphRAG']}
          rows={[
            ['Простые факты («кто CEO компании X?»)', 'Отлично', 'Отлично — паритет'],
            [
              <span key="mh"><Term id="multi-hop">Multi-hop</Term> («кто инвестировал в разработчика X?»)</span>,
              'Completeness 2/5 — теряет звенья цепочки',
              <strong key="g">Completeness 5/5 — проходит всю цепочку</strong>,
            ],
          ]}
        />
        <VS
          left={{
            title: 'Когда GraphRAG оправдан',
            tone: 'good',
            children: (
              <ul>
                <li>Текст богат сущностями и связями (компании, люди, продукты, сделки)</li>
                <li>Пользователи задают multi-hop вопросы про связи</li>
                <li>Вопросов много — setup окупится</li>
              </ul>
            ),
          }}
          right={{
            title: 'Когда НЕ надо',
            tone: 'bad',
            children: (
              <ul>
                <li>Слабоструктурированный текст — сущностей мало, граф выйдет пустым</li>
                <li>Мало вопросов — построение графа (LLM-вызовы + Neo4j) не окупится</li>
                <li>Критична скорость и простота: векторный RAG проще поднять и поддерживать</li>
              </ul>
            ),
          }}
        />
      </Section>

      <ProjectNote>
        <p>
          В Project 4 GraphRAG — <strong>бонусное задание на +30 баллов</strong>: построить граф знаний по отчётам, показать
          обход и сравнить с обычным пайплайном на multi-hop вопросах. Браться стоит, только когда основная часть готова и
          измерена — бонус без работающего baseline не спасёт. Зато сделанный аккуратно (с entity resolution и парой
          красивых Cypher-запросов в отчёте) — сильно выделяет работу.
        </p>
      </ProjectNote>

      <KeyIdea>
        GraphRAG хранит знания как граф «сущности + связи» и отвечает на multi-hop вопросы обходом рёбер, а не лотереей
        top-k. Цена: LLM-извлечение по схеме с patterns, обязательный entity resolution (иначе граф рассыпается на дубли) и
        Neo4j в хозяйстве. На простых вопросах — паритет с векторным RAG, выигрыш — именно на вопросах про связи.
      </KeyIdea>
    </>
  )
}

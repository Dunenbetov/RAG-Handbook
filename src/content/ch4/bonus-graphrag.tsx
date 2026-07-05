import { Analogy, Callout, KeyIdea, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Бонус на 30 баллов: когда за него браться">
        <p>
          Бонусное задание — построить <Term id="knowledge-graph">Knowledge Graph</Term> из тех же двух отчётов и показать,
          где <Term id="graphrag">GraphRAG</Term> отвечает лучше обычного векторного поиска. Задание необязательное, но 30
          баллов — это как ещё одно задание 1B. Правило простое: берись за бонус <strong>только когда закрыта основная
          часть</strong> — эксперименты и вывод стоят те же баллы и обязательны.
        </p>
        <Analogy>
          <p>
            Векторный поиск — это библиотекарь, который приносит страницы, <em>похожие</em> на твой вопрос. А граф знаний —
            детективная доска со фотографиями и нитками: «КТЖ — владеет — проект X», «проект X — расположен — Достык –
            Мойынты». Вопрос «что связано с Достык – Мойынты?» библиотекарь решает плохо (похожих страниц много, связей он
            не видит), а на доске достаточно потянуть за нитку.
          </p>
        </Analogy>
      </Section>

      <Section title="Пять шагов бонуса">
        <Steps
          items={[
            {
              title: 'Разверни Neo4j',
              body: (
                <>
                  <p>
                    Локально через Docker (команда из ТЗ ниже) или бесплатно в облаке — Neo4j Aura Free. После запуска браузер
                    Neo4j доступен на localhost:7474, подключение — bolt://localhost:7687, логин neo4j / password.
                  </p>
                </>
              ),
            },
            {
              title: 'Спроектируй схему сущностей',
              body: (
                <p>
                  Не выдумывай онтологию на лету — сначала реши, какие типы узлов и связей нужны для вопросов из ТЗ. Для
                  годовых отчётов достаточно 5–6 типов сущностей и 5–7 типов связей (таблица ниже).
                </p>
              ),
            },
            {
              title: 'Извлеки сущности и связи LLM-ом',
              body: (
                <p>
                  Прогоняешь текст отчётов через LLM с промптом «извлеки сущности и связи по этой схеме». Проще всего — взять
                  готовый SimpleKGPipeline из neo4j-graphrag-python, который мы разбирали в главе 3: он сам делает чанкинг,
                  извлечение и запись в Neo4j.
                </p>
              ),
            },
            {
              title: 'Напиши Cypher-запросы под вопросы ТЗ',
              body: (
                <p>
                  ТЗ даёт три примерных вопроса — под каждый нужен рабочий <Term id="cypher">Cypher</Term>-запрос с
                  результатом (примеры ниже). Покажи их вместе с выводом в ноутбуке.
                </p>
              ),
            },
            {
              title: 'Сравни GraphRAG и Vector RAG',
              body: (
                <p>
                  Задай одни и те же вопросы обеим системам, сведи в таблицу и напиши честный вывод: где граф выиграл, где
                  проиграл, и почему.
                </p>
              ),
            },
          ]}
        />
        <CodeBlock
          language="bash"
          title="Шаг 1: Neo4j в Docker (команда из ТЗ)"
          code={`docker run -d --name neo4j \\
  -p 7474:7474 -p 7687:7687 \\
  -e NEO4J_AUTH=neo4j/password \\
  neo4j:latest`}
        />
      </Section>

      <Section title="Схема сущностей для годовых отчётов">
        <Tbl
          head={['Тип узла', 'Примеры из отчётов']}
          rows={[
            ['Company', 'АО «НК «ҚТЖ», АО «Матен Петролеум», дочерние организации'],
            ['FinancialMetric', 'Доход 2 163,9 млрд тенге, грузооборот 273,8 млрд т-км'],
            ['Project', 'Вторые пути «Достык – Мойынты», обход станции Алматы'],
            ['Location', 'Достык – Мойынты, Алматы, Атырау'],
            ['Standard', 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018'],
            ['Rating', 'ESG-рейтинг, кредитные рейтинги'],
          ]}
        />
        <p>Связи между ними:</p>
        <ul>
          <li><strong>HAS_METRIC</strong> — Company → FinancialMetric (КТЖ имеет доход 2 163,9 млрд)</li>
          <li><strong>OPERATES</strong> — Company → Project (КТЖ реализует проект вторых путей)</li>
          <li><strong>LOCATED_IN</strong> — Project → Location (проект расположен на участке Достык – Мойынты)</li>
          <li><strong>CERTIFIED_BY</strong> — Company → Standard (КТЖ сертифицирована по ISO 14001)</li>
          <li><strong>HAS_RATING</strong> — Company → Rating; <strong>IMPACTS</strong> — Project → Rating (экопроект влияет на ESG-рейтинг)</li>
        </ul>
        <Callout type="tip" title="Не строй граф по всем 368 страницам">
          <p>
            Извлечение сущностей LLM-ом из всего отчёта КТЖ — это долго, дорого и не нужно. Выбери 3–4 раздела, где живут
            ответы на вопросы ТЗ: стратегия, инвестиционные проекты, ESG. Пары десятков страниц достаточно, чтобы граф
            отвечал на все три вопроса и бонус был засчитан. В выводе честно напиши, что граф покрывает выбранные разделы, —
            это плюс к осознанности, а не минус.
          </p>
        </Callout>
      </Section>

      <Section title="Извлечение: SimpleKGPipeline из главы 3">
        <CodeBlock
          language="python"
          title="graph_build.py — извлечение сущностей и загрузка в Neo4j"
          code={`import neo4j
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
from neo4j_graphrag.llm import OpenAILLM
from neo4j_graphrag.embeddings import OpenAIEmbeddings

driver = neo4j.GraphDatabase.driver(
    "bolt://localhost:7687", auth=("neo4j", "password")
)

kg_builder = SimpleKGPipeline(
    llm=OpenAILLM(model_name="gpt-4o-mini",
                  model_params={"temperature": 0}),
    driver=driver,
    embedder=OpenAIEmbeddings(),
    # наша схема: какие сущности и связи искать
    entities=["Company", "FinancialMetric", "Project",
              "Location", "Standard", "Rating"],
    relations=["HAS_METRIC", "OPERATES", "LOCATED_IN",
               "CERTIFIED_BY", "HAS_RATING", "IMPACTS"],
    from_pdf=False,  # подаём уже распарсенный текст
)

# только выбранные разделы: стратегия, проекты, ESG
for section_text in selected_sections:
    await kg_builder.run_async(text=section_text)`}
        />
        <p>
          После загрузки открой браузер Neo4j и посмотри на граф глазами: если LLM создал дубли («КТЖ» и «АО «НК «ҚТЖ»» как
          разные узлы) — это классическая проблема <Term id="entity-resolution">entity resolution</Term>, упомяни её в
          выводе.
        </p>
      </Section>

      <Section title="Cypher-запросы под три вопроса ТЗ">
        <CodeBlock
          language="sql"
          title="Cypher: три вопроса из ТЗ"
          code={`-- 1. Какие инфраструктурные проекты связаны с «Достык – Мойынты»?
MATCH (p:Project)-[:LOCATED_IN]->(l:Location)
WHERE l.name CONTAINS "Достык"
RETURN p.name, l.name;

-- 2. Какие компании упоминаются в обоих отчётах?
MATCH (c:Company)
WHERE c.source_ktj = true AND c.source_matnp = true
RETURN c.name;
-- (вариант: считать источники через связь MENTIONED_IN → Document)

-- 3. Связь ESG-рейтинга КТЖ с экологическими проектами
MATCH (c:Company {name: "КТЖ"})-[:HAS_RATING]->(r:Rating),
      (proj:Project)-[:IMPACTS]->(r)
RETURN c.name, r.name, collect(proj.name);`}
        />
        <p>
          Заметь: второй и третий вопросы — <Term id="multi-hop">multi-hop</Term>, ответ собирается из нескольких связей.
          Именно на таких вопросах векторный поиск буксует: нужного «куска текста с готовым ответом» в документах просто нет.
        </p>
      </Section>

      <Section title="Сравнение и честный вывод">
        <p>Финальный артефакт бонуса — таблица сравнения на одних и тех же вопросах. Ожидаемая картина примерно такая:</p>
        <Tbl
          head={['Вопрос', 'Vector RAG', 'GraphRAG']}
          rows={[
            [
              'Проекты, связанные с «Достык – Мойынты»?',
              'Находит часть упоминаний, может тащить нерелевантные абзацы',
              'Полный список одним запросом по связям',
            ],
            [
              'Компании в обоих отчётах?',
              'Почти безнадёжно: ответ размазан по двум документам',
              'Одна строка Cypher — пересечение множеств',
            ],
            [
              'Связь ESG-рейтинга и экопроектов?',
              'Найдёт куски про ESG и куски про проекты, связь додумывает LLM',
              'Явная цепочка узлов: проект → влияет → рейтинг',
            ],
            [
              '«Каков доход КТЖ в 2024?»',
              'Отлично: факт лежит в одном чанке',
              'Избыточно: граф для этого не нужен',
            ],
          ]}
        />
        <p>
          В выводе не «продавай» GraphRAG, а разграничь: граф выигрывает на вопросах про <strong>связи, пересечения и
          агрегации</strong> между сущностями, а на простых фактологических вопросах обычный vector search проще, дешевле и
          не хуже. Плюс честно отметь цену: построение графа требует LLM-извлечения (токены + время) и ручной проверки
          качества сущностей.
        </p>
      </Section>

      <KeyIdea>
        Бонус — это пять шагов: Neo4j в Docker → схема из ~6 сущностей и ~6 связей → извлечение LLM-ом из выбранных разделов
        (не всех 368 страниц!) → Cypher под три вопроса ТЗ → таблица сравнения с честным выводом. GraphRAG выигрывает на
        multi-hop вопросах о связях, а не на простых фактах — это и есть главный тезис твоего вывода.
      </KeyIdea>
    </>
  )
}

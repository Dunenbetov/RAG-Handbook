import { Analogy, Callout, KeyIdea, No, ProjectNote, Section, VS, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { ParentChildDemo } from '../../components/interactive/ParentChildDemo'

export default function Lesson() {
  return (
    <>
      <Section title="Дилемма размера чанка — и как её обойти">
        <p>Из главы 1 ты помнишь трейд-офф:</p>
        <VS
          left={{
            title: 'Мелкие чанки (300–500)',
            tone: 'neutral',
            children: (
              <ul>
                <li><Yes />Точный поиск: вектор кодирует один конкретный факт</li>
                <li><No />LLM получает обрывок: цифру без подписи, вывод без предпосылок</li>
              </ul>
            ),
          }}
          right={{
            title: 'Крупные чанки (1500–2000)',
            tone: 'neutral',
            children: (
              <ul>
                <li><Yes />LLM видит полный контекст</li>
                <li><No />Размытый поиск: вектор усредняет несколько тем</li>
              </ul>
            ),
          }}
        />
        <p>
          <Term id="parent-child">Parent-Child retrieval</Term> (он же small-to-big) отказывается выбирать:{' '}
          <strong>ищем по мелким, отдаём в LLM крупные</strong>. Документ режется дважды: на крупных «родителей» (~2000
          символов) и мелких «детей» (~400) внутри каждого родителя. Векторный индекс строится по детям, но когда ребёнок
          найден — в контекст LLM отправляется весь его родитель.
        </p>
        <Analogy>
          <p>
            Так работает поиск по книге через предметный указатель: ты находишь в указателе точную строчку «тариф грузовой, с.
            187» (ребёнок), но читать открываешь <em>всю страницу 187</em> (родителя) — потому что понять цифру без абзаца
            вокруг невозможно.
          </p>
        </Analogy>
      </Section>

      <Section title="Посмотри на механику">
        <p>Пройди демо по шагам: запрос находит мелкий чанк, а LLM получает крупный блок — с соседними предложениями, из которых берётся сравнение с прошлым годом.</p>
        <ParentChildDemo />
      </Section>

      <Section title="Реализация: ParentDocumentRetriever">
        <p>В LangChain всё уже готово — код с семинара модуля 2:</p>
        <CodeBlock
          language="python"
          title="advanced_rag.py — parent-child из семинара"
          code={`from langchain_classic.retrievers import ParentDocumentRetriever
from langchain_core.stores import InMemoryStore
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

# Двойная нарезка
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
child_splitter  = RecursiveCharacterTextSplitter(chunk_size=400,  chunk_overlap=50)

# Дети — в векторный индекс, родители — в docstore
child_vectorstore = Chroma(collection_name="adv_children", embedding_function=embeddings)
parent_store = InMemoryStore()

parent_retriever = ParentDocumentRetriever(
    vectorstore=child_vectorstore,
    docstore=parent_store,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
    search_kwargs={"k": 8},   # ищем 8 детей → получаем N уникальных родителей
)
parent_retriever.add_documents(docs)   # режет и индексирует сам

docs = parent_retriever.invoke("Какой доход от грузовых перевозок?")
# docs — это уже РОДИТЕЛИ (крупные блоки), а не найденные дети`}
        />
        <Callout type="info" title="Деталь: 8 детей ≠ 8 родителей">
          <p>
            Несколько найденных детей часто принадлежат одному родителю — после дедупликации из 8 детей может получиться 3–4
            уникальных родителя. Это фича: если несколько кусков блока сматчились с вопросом, блок точно релевантен.
          </p>
        </Callout>
      </Section>

      <Section title="Что это даёт на практике">
        <p>
          Главный эффект по итогам семинара — <strong>меньше галлюцинаций на числах</strong>. Цифры приходят к модели вместе с
          подписями, единицами измерения и соседними абзацами: ей не приходится догадываться, к чему относится «1 875,6». В
          анализе иерархии (analyze_hierarchy.py) parent-child ещё и поднимал в выдаче страницы, которые наивный поиск
          пропускал: мелкий ребёнок матчится точнее, чем усреднённый чанк на 1000 символов.
        </p>
      </Section>

      <ProjectNote>
        <p>
          В ТЗ parent-child не назван обязательным, но это сильный кандидат в твой Advanced-пайплайн: он напрямую лечит
          проблему «цифры из разных строк путаются» из списка ожидаемых проблем. И он отлично комбинируется с обязательным
          hybrid: BM25 можно строить прямо по родителям (так сделано на семинаре).
        </p>
      </ProjectNote>

      <KeyIdea>
        Parent-Child снимает дилемму размера чанка: мелкие дети дают снайперскую точность поиска, крупные родители — полный
        контекст для LLM. Результат — точные цифры с подписями и заметно меньше галлюцинаций.
      </KeyIdea>
    </>
  )
}

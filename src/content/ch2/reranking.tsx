import { Analogy, Callout, KeyIdea, No, ProjectNote, Section, Tbl, VS, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Второй взгляд на результаты поиска">
        <p>
          Поиск нашёл 20 кандидатов, но в LLM ты передашь только 5. Кто решает, какие пять? Позиции из поиска — грубая
          оценка. <Term id="reranking">Reranking</Term> добавляет второй этап: специальная модель внимательно перечитывает
          каждую пару «вопрос — чанк» и выставляет точный балл релевантности. Топ после переранжирования — совсем другого
          качества.
        </p>
        <Analogy>
          <p>
            Наём сотрудника: сначала HR быстро отбирает 20 резюме по ключевым словам из тысячи (retriever — быстрый, но
            поверхностный). Потом технический эксперт читает каждое из 20 внимательно и ранжирует заново (reranker — медленный,
            но глубокий). Никто не заставляет эксперта читать всю тысячу — в этом и экономика двухэтапного отбора.
          </p>
        </Analogy>
      </Section>

      <Section title="Почему reranker точнее: bi-encoder vs cross-encoder">
        <VS
          left={{
            title: 'Bi-encoder (обычный поиск)',
            tone: 'neutral',
            children: (
              <>
                <p>Вопрос и документ кодируются <strong>независимо</strong>, заранее. Сравниваются готовые векторы.</p>
                <ul>
                  <li><Yes />Молниеносно: векторы документов посчитаны офлайн</li>
                  <li><No />Модель не видит вопрос и документ вместе — тонкие связи теряются при сжатии в один вектор</li>
                </ul>
              </>
            ),
          }}
          right={{
            title: 'Cross-encoder (reranker)',
            tone: 'neutral',
            children: (
              <>
                <p>Вопрос и документ проходят через модель <strong>вместе</strong>: attention видит взаимодействие каждого слова вопроса с каждым словом документа.</p>
                <ul>
                  <li><Yes />Заметно точнее оценивает релевантность</li>
                  <li><No />Прогон модели на каждую пару в рантайме — дорого, только для топ-K</li>
                </ul>
              </>
            ),
          }}
        />
        <p>
          Отсюда и архитектура: <Term id="bi-encoder">bi-encoder</Term> быстро сужает миллион чанков до 20 кандидатов,{' '}
          <Term id="cross-encoder">cross-encoder</Term> дорого и точно ранжирует эти 20.
        </p>
      </Section>

      <Section title="До и после: что меняет reranking">
        <Tbl
          head={['Позиция', 'После retrieval (bi-encoder)', 'После reranking (cross-encoder)']}
          rows={[
            ['1', 'Общий обзор сегмента перевозок', <span key="r1"><Yes />Таблица с доходами по видам перевозок за 2024</span>],
            ['2', 'История компании и миссия', 'Абзац с динамикой доходов 2023→2024'],
            ['3', <span key="r3"><Yes />Таблица с доходами по видам перевозок за 2024</span>, 'Общий обзор сегмента перевозок'],
            ['4', 'ESG-показатели', 'История компании и миссия'],
            ['5', 'Абзац с динамикой доходов 2023→2024', 'ESG-показатели'],
          ]}
        />
        <p>
          Правильный чанк стоял третьим — после reranking он первый, а второй по-настоящему полезный чанк поднялся с 5-го
          места. Если бы ты передавал в LLM top-3, до reranking модель получила бы два мусорных чанка из трёх.
        </p>
      </Section>

      <Section title="Код">
        <CodeBlock
          language="python"
          title="rerank.py — cross-encoder поверх retrieval"
          code={`from FlagEmbedding import FlagReranker

# Рекомендованная ТЗ модель (мультиязычная)
reranker = FlagReranker("BAAI/bge-reranker-v2-m3", use_fp16=True)

def rerank(query: str, docs: list, top_n: int = 5):
    pairs = [(query, d.page_content) for d in docs]
    scores = reranker.compute_score(pairs)          # точный скор каждой пары
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked[:top_n]]

# Двухэтапный поиск:
candidates = hybrid_retriever.invoke(question)      # быстро: топ-20 кандидатов
final_docs = rerank(question, candidates, top_n=5)  # точно: лучшие 5 в LLM`}
        />
        <Callout type="warn" title="Цена вопроса">
          <p>
            Reranker — это ещё одна нейросеть в онлайн-фазе: на CPU прогон 20 пар занимает заметные доли секунды, на GPU —
            быстрее. Правило: retriever достаёт с запасом (top-20…50), reranker сужает до финальных top-5. Гонять его по всей
            базе нельзя.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Reranking — обязательный пункт задания 1B: модель <strong>BAAI/bge-reranker-v2-m3</strong>, и ТЗ требует показать
          результаты <strong>до и после</strong> (сделай таблицу как выше, только со своими реальными чанками). В задании 2
          «Reranking вкл/выкл» — один из гиперпараметров: провери, на каких типах вопросов он помогает сильнее (спойлер: там,
          где кандидатов много и они похожи).
        </p>
      </ProjectNote>

      <KeyIdea>
        Retrieval — быстрый грубый отбор (bi-encoder), reranking — медленная точная сортировка кандидатов (cross-encoder,
        который читает вопрос и документ вместе). Двухэтапная схема даёт точность cross-encoder по цене прогона на 20 парах, а
        не на миллионе.
      </KeyIdea>
    </>
  )
}

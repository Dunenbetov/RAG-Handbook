import { Analogy, Callout, KeyIdea, ProjectNote, Section, Tbl, Warn, Yes } from '../../components/ui'
import { Timer } from 'lucide-react'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Момент истины: собираем всё вместе">
        <p>
          Мы разобрали пять техник. Но помогают ли они <em>на самом деле</em>? Семинар недели 12 отвечает честным
          экспериментом: два пайплайна, один документ (годовой отчёт АО «ЛОТТЕ Рахат»), 30 вопросов golden dataset — и
          прямое сравнение метрик.
        </p>
        <Tbl
          head={['', 'Naive RAG', 'Advanced RAG']}
          rows={[
            ['Чанкинг', 'RecursiveCharacterTextSplitter (1000/200)', 'Parent-Child: дети 400/50, родители 2000/200'],
            ['Поиск', 'Косинус в Chroma, top-5', 'MultiQuery( Hybrid( ParentChild + BM25 ) ) → top-5 родителей'],
            ['Эмбеддинги', 'text-embedding-3-small', 'та же'],
            ['LLM', 'gpt-4o-mini', 'та же'],
          ]}
        />
        <p>
          Вопросы разбиты на три категории по 10 штук: <strong>simple</strong> (прямые фактические), <strong>table</strong>{' '}
          (ответ в таблице) и <strong>synthesis</strong> (нужно связать несколько фактов).
        </p>
      </Section>

      <Section title="Результаты: числа, а не ощущения">
        <Tbl
          head={['Метрика', 'Naive', 'Advanced', 'Прирост']}
          rows={[
            [<span key="h"><Term id="hit-rate">Hit Rate@5</Term></span>, '0.933', '1.000', <span key="p1">+7.2% <Yes /></span>],
            [<span key="m"><Term id="mrr">MRR</Term></span>, '0.829', '0.878', <span key="p2">+5.9% <Yes /></span>],
            ['Correctness (судья, 0–5)', '4.367', '4.700', <span key="p3">+7.6% <Yes /></span>],
            ['Completeness (судья, 0–5)', '4.233', '4.600', <span key="p4">+8.7% <Yes /></span>],
            ['Средний балл судьи', '4.516', '4.758', <span key="p5">+5.3% <Yes /></span>],
            [<span key="lat"><Timer className="mr-1 inline size-4 -translate-y-px text-muted" />Latency, сек/запрос</span>, '1.78', '4.68', <span key="p6">+163% <Warn /></span>],
          ]}
        />
        <p>По категориям вопросов картина ещё интереснее:</p>
        <Tbl
          head={['Категория', 'Naive', 'Advanced', 'Комментарий']}
          rows={[
            ['Simple', '4.53', '5.00', 'Идеальный балл: parent-child даёт полный контекст'],
            ['Table', '4.48', '4.70', 'BM25 ловит точные числа из таблиц — главный вклад гибрида'],
            ['Synthesis', '4.55', '4.58', 'Почти без изменений: связывание фактов — всё ещё слабое место'],
          ]}
        />
        <Analogy>
          <p>
            Это как апгрейд автомобиля: новые тормоза и подвеска дали +5% к времени круга — звучит скромно, но именно эти
            проценты отделяют подиум от середины пелотона. А вот расход топлива вырос заметно (латентность ×2.6) — и решать,
            стоит ли оно того, нужно от задачи.
          </p>
        </Analogy>
      </Section>

      <Section title="Как измеряли">
        <p>Два слоя метрик — тебе понадобятся оба в Project 4:</p>
        <CodeBlock
          language="python"
          title="evaluate.py — retrieval-метрики + LLM-судья"
          code={`# 1. Метрики поиска: знаем правильную страницу (source_page) каждого вопроса
def retrieval_metrics(result):
    target = result["source_page"]
    pages = [c["page"] for c in result["retrieved_chunks"]]
    hit = 1.0 if target in pages else 0.0                      # Hit Rate
    rr = 1.0 / (pages.index(target) + 1) if target in pages else 0.0   # MRR
    return hit, rr

# 2. Метрики генерации: LLM-судья оценивает каждый ответ 0–5
JUDGE_PROMPT = """Оцени ответ от 0 до 5 по критериям:
1. Relevance: насколько ответ релевантен вопросу?
2. Faithfulness: основан ли ответ только на контексте?
3. Correctness: фактически верен ли по сравнению с эталоном?
4. Completeness: включены ли все ключевые элементы эталона?
Верни JSON: {"relevance": ..., "faithfulness": ..., "correctness": ..., "completeness": ...}"""`}
        />
      </Section>

      <Section title="Выводы семинара">
        <ul>
          <li>
            <strong>Каждая техника лечит свою болезнь.</strong> BM25 → таблицы и цифры (+18.2% на table-вопросах),
            parent-child → полнота и меньше галлюцинаций, query expansion → чуть-чуть на synthesis.
          </li>
          <li>
            <strong>За качество платим латентностью.</strong> ×2.6 замедление, и главный виновник — LLM-вызов в{' '}
            <Term id="query-expansion">Query Expansion</Term>. В проде его включают выборочно или кэшируют.
          </li>
          <li>
            <strong>Комбо сильнее одиночных техник.</strong> Цепочка MultiQuery(Hybrid(ParentChild)) закрыла Hit Rate до
            1.000 — каждый retriever страхует слепые зоны других.
          </li>
        </ul>
        <Callout type="tip" title="Рецепт для продакшна с семинара">
          <ul>
            <li>Фактические вопросы → хватает Parent-Child (без Query Expansion)</li>
            <li>Таблицы → обязательно BM25 в гибриде</li>
            <li>Сложные вопросы → полная цепочка + reranking</li>
          </ul>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Этот семинар — готовый шаблон для сравнения Naive vs Advanced в задании 1: та же структура (два пайплайна → один
          датасет → таблица метрик → выводы по категориям вопросов). Отличия Project 4: документы сложнее (нужен layout-парсинг),
          вместо самописного судьи — <Term id="ragas">RAGAS</Term>, и обязателен reranking. Обрати внимание, как семинар
          честно указывает цену (latency) — такой же честности ждут от твоего итогового вывода.
        </p>
      </ProjectNote>

      <KeyIdea>
        Advanced RAG на реальном документе дал +5.3% качества и идеальный Hit Rate ценой ×2.6 латентности. Улучшения
        приходят не «вообще», а по категориям: BM25 вытянул таблицы, parent-child — полноту. Меряй по категориям — и
        узнаешь, какая техника работает именно на твоих данных.
      </KeyIdea>
    </>
  )
}

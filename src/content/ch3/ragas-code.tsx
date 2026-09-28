import { Analogy, Callout, KeyIdea, ProjectNote, Section, Steps, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="От теории к практике: RAGAS за четыре шага">
        <p>
          В прошлом уроке мы разобрали, <em>что</em> считают четыре метрики. Теперь — <em>как</em> запустить это в коде.
          Хорошая новость: библиотека <Term id="ragas">ragas</Term> берёт всю магию LLM-судьи на себя, от тебя нужны только
          данные в правильном формате. Весь процесс — четыре шага:
        </p>
        <Steps
          items={[
            {
              title: 'Собери samples',
              body: 'Для каждого вопроса — сам вопрос, ответ твоей системы, найденные чанки и эталонный ответ.',
            },
            {
              title: 'Настрой судью',
              body: 'LLM для оценки (обязательно temperature=0) и embedding-модель для Answer Relevancy.',
            },
            {
              title: 'Выбери метрики',
              body: 'Четвёрка из прошлого урока, каждой передаётся судья.',
            },
            {
              title: 'Запусти evaluate()',
              body: 'Получишь per-sample скоры и средние по датасету.',
            },
          ]}
        />
      </Section>

      <Section title="Шаг 1: данные — SingleTurnSample и EvaluationDataset">
        <p>
          Единица оценивания — <code>SingleTurnSample</code>: один вопрос со всем, что нужно судье. Обрати внимание на поле{' '}
          <code>reference</code> — это эталонный ответ из <Term id="golden-dataset">golden dataset</Term>, без него не
          посчитается <Term id="context-recall">Context Recall</Term>.
        </p>
        <CodeBlock
          language="python"
          title="samples.py"
          code={`from ragas import SingleTurnSample, EvaluationDataset

sample = SingleTurnSample(
    user_input="Каков был доход КТЖ от грузовых перевозок в 2024 году?",
    response="Доход от грузовых перевозок составил 1 875,6 млрд тенге.",  # ответ твоего RAG
    retrieved_contexts=[chunk_1, chunk_2, chunk_3],  # что принёс retriever (список строк)
    reference="В 2024 году доход КТЖ от грузовых перевозок составил 1 875,6 млрд тенге, рост на 11,5%.",
)

eval_dataset = EvaluationDataset(samples=[sample_1, sample_2, ...])`}
        />
      </Section>

      <Section title="Шаги 2–3: судья и метрики">
        <p>
          Судья — обычная LLM, обёрнутая в адаптер ragas. Берём недорогую, но адекватную модель и{' '}
          <strong>обязательно temperature=0</strong>: оценки должны быть воспроизводимыми, а не «сегодня судья добрый».
          Для <Term id="answer-relevancy">Answer Relevancy</Term> дополнительно нужна embedding-модель — она сравнивает
          сгенерированные вопросы с исходным.
        </p>
        <CodeBlock
          language="python"
          title="judge_and_metrics.py"
          code={`from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas.metrics import (
    Faithfulness,
    ResponseRelevancy,
    LLMContextRecall,
    LLMContextPrecisionWithReference,
)

evaluator_llm = LangchainLLMWrapper(
    ChatOpenAI(model="gpt-4o-mini", temperature=0)
)
evaluator_embeddings = LangchainEmbeddingsWrapper(
    OpenAIEmbeddings(model="text-embedding-3-small")
)

metrics = [
    Faithfulness(llm=evaluator_llm),
    ResponseRelevancy(llm=evaluator_llm, embeddings=evaluator_embeddings),
    LLMContextRecall(llm=evaluator_llm),
    LLMContextPrecisionWithReference(llm=evaluator_llm),
]`}
        />
        <Callout type="warn" title="ragas 0.4+: что поменялось в API">
          <p>
            Код урока написан на API ragas 0.2–0.3, как на семинаре. В 0.4 он ещё работает, но с предупреждениями:{' '}
            <code>LangchainLLMWrapper</code> и <code>evaluate()</code> помечены deprecated. Судью теперь создают через{' '}
            <code>llm_factory()</code> (embeddings — через <code>embedding_factory()</code>), метрики переехали в{' '}
            <code>ragas.metrics.collections</code> и считаются вызовом <code>ascore(...)</code> с именованными полями
            вместо <code>SingleTurnSample</code>. Результат — <code>MetricResult</code>, число лежит в{' '}
            <code>.value</code>. На смену <code>evaluate()</code> для прогона по датасету пришёл декоратор{' '}
            <code>@experiment</code>.
          </p>
        </Callout>
        <CodeBlock
          language="python"
          title="faithfulness_v04.py — то же на API ragas 0.4"
          code={`from openai import AsyncOpenAI
from ragas.llms import llm_factory
from ragas.metrics.collections import Faithfulness

client = AsyncOpenAI()
evaluator_llm = llm_factory("gpt-4o-mini", client=client, temperature=0)

faithfulness = Faithfulness(llm=evaluator_llm)
result = await faithfulness.ascore(
    user_input=item["question"],
    response=answer,
    retrieved_contexts=contexts,
)
print(result.value)  # MetricResult → число`}
        />
      </Section>

      <Section title="Шаг 4: полный прогон по golden dataset">
        <p>
          Собираем всё вместе: гоняем свой <code>rag_pipeline()</code> по всем вопросам golden dataset, складываем результаты
          в samples и запускаем оценку.
        </p>
        <CodeBlock
          language="python"
          title="run_evaluation.py"
          code={`import json
from ragas import evaluate

samples = []
for item in golden_dataset:  # 30 пар «вопрос — эталонный ответ»
    answer, contexts = rag_pipeline(item["question"])  # твой пайплайн
    samples.append(SingleTurnSample(
        user_input=item["question"],
        response=answer,
        retrieved_contexts=contexts,
        reference=item["reference_answer"],
    ))

eval_dataset = EvaluationDataset(samples=samples)
result = evaluate(dataset=eval_dataset, metrics=metrics)

print(result)            # средние: faithfulness: 0.95, answer_relevancy: 0.87, ...
df = result.to_pandas()  # per-sample скоры — ищи вопросы с провалами

# кэшируй результат каждого эксперимента — судья стоит денег!
df.to_json("results/exp_01_baseline.json")`}
        />
        <Callout type="tip" title="Смотри per-sample, не только средние">
          <p>
            <code>result.to_pandas()</code> даёт скоры по каждому вопросу. Отсортируй по возрастанию Faithfulness и прочитай
            три худших ответа глазами — это самый быстрый способ понять, что реально ломается (и не ошибся ли сам судья).
          </p>
        </Callout>
      </Section>

      <Section title="Эксперимент с лекции: намеренно ломаем retrieval">
        <p>
          Как убедиться, что метрики действительно «видят» поломки? На лекции провели контрольный эксперимент: взяли рабочий
          пайплайн и <strong>намеренно испортили retrieval</strong> — вместо найденных чанков подсунули нерелевантные
          документы. Вот что случилось с метриками:
        </p>
        <Tbl
          head={['Метрика', 'Здоровый пайплайн', 'Сломанный retrieval', 'Падение']}
          rows={[
            ['Faithfulness', '0.95', '0.72', '−0.23'],
            ['Answer Relevancy', '0.87', '0.65', '−0.22'],
            ['Context Recall', '0.92', '0.45', '−0.47'],
            [<strong key="cp">Context Precision</strong>, <strong key="b">0.89</strong>, <strong key="a">0.33</strong>, <strong key="d">−0.56</strong>],
          ]}
        />
        <p>
          Профиль падения — ровно как по учебнику. Сильнее всех рухнул <Term id="context-precision">Context
          Precision</Term> (мусор в топе выдачи — его прямая специальность), следом Context Recall (нужных фактов в
          контексте больше нет). Метрики генерации просели меньше: модель честно пыталась работать с тем, что дали, —
          где-то отвечала «в контексте нет ответа», где-то съезжала в нерелевантный пересказ. Это и есть диагностика по
          профилю: <strong>поисковая пара упала сильнее генерационной → чини retrieval</strong>.
        </p>
      </Section>

      <Section title="Практические заметки: деньги, стабильность, кэш">
        <ul>
          <li>
            <strong>Оценка стоит денег.</strong> Каждый прогон — это LLM-вызовы: N вопросов × 4 метрики (а Faithfulness
            внутри делает ещё несколько вызовов на разбор claims). 30 вопросов × 4 метрики — это уже за сотню запросов к
            судье. Не гоняй оценку после каждой правки кода — только для осмысленных экспериментов.
          </li>
          <li>
            <strong>temperature=0 у судьи.</strong> Иначе один и тот же ответ получит сегодня 0.8, завтра 0.7 — и сравнение
            экспериментов превратится в лотерею.
          </li>
          <li>
            <strong>Кэшируй результаты в JSON.</strong> Каждый эксперимент — отдельный файл (<code>exp_01_baseline.json</code>,{' '}
            <code>exp_02_hybrid.json</code>...). Итоговая таблица сравнения соберётся из кэша бесплатно, и не придётся
            перепрогонять оценку, когда будешь писать отчёт.
          </li>
        </ul>
        <Analogy>
          <p>
            Прогон RAGAS — как вызов платного эксперта-аудитора: каждый вопрос из датасета он разбирает по четырём пунктам,
            и каждый пункт — оплачиваемый час. Ты же не будешь звать аудитора после каждой перестановки мебели в офисе?
            Зовёшь его на важные вехи, а его отчёты подшиваешь в папку (кэш), чтобы потом сравнивать между собой, а не
            заказывать заново.
          </p>
        </Analogy>
      </Section>

      <ProjectNote>
        <p>
          В Project 4 этот скрипт — твой главный рабочий инструмент задания 2: golden dataset на 30 пар уже дан в ТЗ,
          каждый эксперимент (baseline, новый чанкинг, hybrid, reranking...) прогоняется через RAGAS, результаты кэшируются
          в JSON и сводятся в таблицу сравнения. Именно эта таблица с твоими выводами приносит половину баллов.
        </p>
      </ProjectNote>

      <KeyIdea>
        Запуск RAGAS — это конвейер: samples (вопрос + ответ + контексты + reference) → судья с temperature=0 → 4 метрики →
        evaluate(). Метрики реально ловят поломки: при испорченном retrieval первыми рушатся Context Precision и Context
        Recall. Оценка стоит денег — прогоняй на осмысленных экспериментах и кэшируй результаты.
      </KeyIdea>
    </>
  )
}

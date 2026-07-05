import { Analogy, Callout, Formula, KeyIdea, ProjectNote, Section } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { RRFCalculator } from '../../components/interactive/RRFCalculator'

export default function Lesson() {
  return (
    <>
      <Section title="Проблема: как сложить несравнимое">
        <p>
          В главе 1 мы смешивали BM25 и векторный поиск через альфа-взвешивание: score = α·dense + (1−α)·sparse. Но тут есть
          подвох: скоры двух методов живут в <strong>разных вселенных</strong>. Косинусное сходство — от −1 до 1, скоры BM25 —
          от 0 до бесконечности и зависят от длины документов и частот слов. Складывать их напрямую — как складывать метры с
          килограммами; нормализация помогает, но она хрупкая.
        </p>
        <p>
          <Term id="rrf">RRF</Term> (Reciprocal Rank Fusion) решает проблему элегантно: <strong>забудь про скоры, смотри на
          позиции</strong>. Неважно, с каким счётом документ занял 2-е место в списке BM25 — важно, что он второй.
        </p>
        <Formula note="Сумма по всем спискам результатов; rank — позиция документа в списке, k = 60 (стандартная константа, сглаживает разницу верхних позиций)">
          RRF(doc) = Σ 1 / (k + rank_i)
        </Formula>
        <Analogy>
          <p>
            Это как судейство в фигурном катании: у одного судьи шкала строгая, у другого щедрая — сырые баллы несравнимы.
            Поэтому берут <em>места</em>, которые каждый судья присвоил. Спортсмен, который у обоих судей в тройке, обойдёт
            того, кто у одного судьи первый, а у другого — десятый.
          </p>
        </Analogy>
      </Section>

      <Section title="Посчитай RRF сам">
        <p>
          В калькуляторе два сценария. Обрати внимание на «Конфликт методов»: документ C не был первым ни у кого, но стабильно
          второй у обоих — и RRF выводит его в лидеры. Стабильность бьёт спорное лидерство. Заодно подвигай k: чем он меньше,
          тем сильнее вес первых позиций.
        </p>
        <RRFCalculator />
      </Section>

      <Section title="Код: EnsembleRetriever и самописный RRF">
        <CodeBlock
          language="python"
          title="hybrid.py — гибрид из семинара модуля 2"
          code={`from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever

# BM25 по тем же документам (родителям из parent-child)
bm25_retriever = BM25Retriever.from_documents(parent_docs, k=8)

# EnsembleRetriever объединяет результаты через RRF
hybrid_retriever = EnsembleRetriever(
    retrievers=[parent_retriever, bm25_retriever],
    weights=[0.5, 0.5],        # веса методов в RRF-сумме
)

docs = hybrid_retriever.invoke("Какой тариф на участке Достык – Мойынты?")`}
        />
        <p>А вот RRF без магии, руками — полезно для понимания и для отчёта:</p>
        <CodeBlock
          language="python"
          title="rrf.py — своя реализация"
          code={`from collections import defaultdict

def rrf_fusion(semantic_results, bm25_results, k=60):
    """Слияние двух ранжированных списков по позициям."""
    scores = defaultdict(float)

    for rank, doc_id in enumerate(semantic_results):
        scores[doc_id] += 1.0 / (k + rank + 1)

    for rank, doc_id in enumerate(bm25_results):
        scores[doc_id] += 1.0 / (k + rank + 1)

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)`}
        />
        <Callout type="tip" title="RRF масштабируется">
          <p>
            Формула не ограничена двумя списками: можно слить BM25 + dense + результаты по переформулированным запросам из
            Query Expansion — любое количество источников, лишь бы у каждого был ранжированный список.
          </p>
        </Callout>
      </Section>

      <Section title="Где гибрид выигрывает: цифры семинара">
        <p>
          На сравнении Naive vs Advanced (отчёт «Рахат») гибрид дал самый заметный вклад на <strong>табличных вопросах: +18.2%</strong>{' '}
          по оценке судьи — BM25 ловит точные числовые токены вроде «30.43», которые векторный поиск размывает. Общий MRR
          вырос на +8.5%: документ, релевантный по обоим методам, поднимается в топ.
        </p>
      </Section>

      <ProjectNote>
        <p>
          Hybrid Search через RRF — <strong>обязательное требование задания 1B</strong> («это критично для поиска точных
          названий и цифр» — прямая цитата ТЗ). А параметр alpha (вес vector vs BM25) — обязательный кандидат в эксперименты
          задания 2: прогони 0.0 / 0.3 / 0.5 / 0.7 / 1.0 и объясни оптимум. Спойлер: для отчётов с обилием цифр оптимум
          обычно смещён в сторону BM25.
        </p>
      </ProjectNote>

      <KeyIdea>
        RRF сливает ранжированные списки по позициям, а не по скорам — поэтому ему не важно, что BM25 и косинус «меряют в
        разных единицах». Документ, стабильно высокий в обоих списках, побеждает. Формула: Σ 1/(k + rank), k = 60.
      </KeyIdea>
    </>
  )
}

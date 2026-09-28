import { Link } from 'react-router-dom'
import { Callout, Formula, KeyIdea, No, ProjectNote, Section, Tbl, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Golden dataset: откуда брать и сколько">
        <p>
          <Term id="golden-dataset">Golden dataset</Term> — фиксированный набор кейсов с ожидаемым результатом, на котором
          прогоняется каждая версия. Хорошие источники:
        </p>
        <ul>
          <li><strong>Прод-трейсы</strong> с низким score, негативным фидбеком или ручной правкой человека.</li>
          <li><strong>Edge cases и атаки</strong>: пустой контекст, инъекции, нет скриншота, конфликт двух пунктов ТЗ.</li>
          <li><strong>Покрытие типов</strong>: по несколько кейсов на каждый класс ответа, а не 30 похожих «счастливых путей».</li>
        </ul>
        <p>
          Кейс — это не только «вопрос → ответ». Полезно хранить допустимые альтернативы и запреты: так метрика не штрафует
          честное «не знаю» и ловит опасные ошибки.
        </p>
        <CodeBlock
          language="json"
          title="evals/golden.json: один кейс remark-round"
          code={`{
  "id": "defect-save-gray",
  "type": "1 дефект с опорой на ТЗ",
  "remark": { "description": "Кнопка «Сохранить» серая", "pageOrScreen": "Профиль компании" },
  "screenshot": "before-save-gray.png",
  "gold": { "expect": ["defect_candidate"], "abstainOk": false, "section": "§2.1" }
}`}
        />
        <Callout type="danger" title="Главная ловушка">
          <p>
            Нельзя тюнить промпт на тех же кейсах, по которым отчитываешься: метрика растёт, а качество на новых данных — нет.
            Раздели набор на dev (правишь промпт) и отложенную выборку (holdout, смотришь только в конце). 30–50 кейсов
            хватает на регрессионный гейт, но не на различение мелких эффектов: шум ±1 кейс из 33 разбирается в уроке{' '}
            <Link to="/ch9/ab-testing" className="text-accent hover:underline">про A/B</Link>.
          </p>
        </Callout>
      </Section>

      <Section title="Метрики: с эталоном и без, код или судья">
        <Tbl
          head={['Метрика', 'Нужен эталон?', 'Кто считает']}
          rows={[
            ['Точность класса, exact match', <><Yes />да</>, 'код'],
            ['Валидность JSON по схеме', <><No />нет</>, 'код'],
            ['Структурная проверка цитат (remark-round)', <><No />нет (в evals плюс запреты mustNotMatch из golden)</>, 'код (регулярки)'],
            [<><Term id="hit-rate">hit@k</Term>, <Term id="mrr">MRR</Term>, nDCG</>, <><Yes />да, разметка релевантных</>, 'код'],
            [<>RAGAS <Term id="faithfulness">faithfulness</Term>, answer relevancy</>, <><No />нет</>, 'LLM-судья'],
            ['Context recall, factual correctness', <><Yes />да, reference</>, 'LLM-судья'],
          ]}
        />
        <Formula note="rel_i — релевантность документа на позиции i; IDCG — DCG идеального порядка">
          nDCG@k = DCG@k / IDCG@k,  DCG@k = Σ rel_i / log₂(i + 1)
        </Formula>
        <p>
          hit@k отвечает «нашли ли», MRR — «насколько высоко первый правильный», nDCG — «насколько хорош весь порядок» и
          умеет градации релевантности. RAGAS-метрики разобраны в{' '}
          <Link to="/ch3/ragas" className="text-accent hover:underline">главе 3</Link>. По времени запуска evals бывают{' '}
          <strong>offline</strong> (прогон по golden до деплоя, регрессия) и <strong>online</strong> (оценка живых трейсов:
          асинхронный судья на выборке трафика, фидбек пользователей как score или inline-проверка прямо в графе). Правило
          выбора: всё, что проверяется кодом, проверяй кодом — это бесплатно и детерминированно; судью зови для смысла.
        </p>
      </Section>

      <Section title="LLM-as-judge без самообмана">
        <p>
          <Term id="llm-judge">LLM-судья</Term> оценивает ответ по рубрике. У судьи известные смещения:{' '}
          <strong>position bias</strong> (в парном сравнении любит первый или второй вариант),{' '}
          <strong>verbosity bias</strong> (длиннее — значит лучше), <strong>self-preference</strong> (выше оценивает тексты
          своей модели или семейства). Отсюда правила:
        </p>
        <CodeBlock
          language="python"
          title="Судья: рубрика, strict JSON, temperature 0"
          code={`VERDICT = {"type": "object", "additionalProperties": False,
           "required": ["reason", "score"],
           "properties": {"reason": {"type": "string"},          # сначала обоснование
                          "score": {"type": "integer", "enum": [1, 2, 3, 4, 5]}}}

r = client.chat.completions.create(
    model=JUDGE_MODEL,   # сильнее генератора; от self-preference — другое семейство
    temperature=0,
    messages=[{"role": "system", "content": RUBRIC},   # шкала с примерами на каждый балл
              {"role": "user", "content": f"Контекст: {ctx}\\nОтвет: {answer}"}],
    response_format={"type": "json_schema",
                     "json_schema": {"name": "verdict", "strict": True, "schema": VERDICT}},
)
# парное сравнение: прогоняй A/B и B/A, засчитывай только согласованный вердикт`}
        />
        <p>
          Судью надо <strong>калибровать</strong>: 30–50 ответов размечают люди, потом считают согласие судьи с ними. Голый
          процент совпадений обманывает на несбалансированных классах, поэтому считают каппу Коэна:
        </p>
        <Formula note="p_o — наблюдаемое согласие, p_e — согласие, ожидаемое случайно при тех же долях классов">
          κ = (p_o − p_e) / (1 − p_e)
        </Formula>
        <p>
          Пример: из 33 черновиков люди считают плохими 4, судья — 3, совпали в 30 случаях. Согласие 91%, но p_e ≈ 0,81, и
          κ ≈ 0,52 — только умеренное. Судья, который всегда говорит «хорошо», получил бы 88% согласия и κ = 0.
        </p>
        <Callout type="tip" title="Вопрос на защите">
          <p>
            «Почему faithfulness у вас не LLM-судья?» — Это структурная проверка кодом: ссылка на раздел только из цитат,
            «на кадре» только при кадре, дефект только с цитатой. Она бесплатна, детерминирована и стоит воротами в графе,
            поэтому на golden около 100% по построению. Смысловое искажение верной цитаты она не видит: 4 фактические ошибки
            mini в черновиках нашли только чтением. Следующий шаг — судья, откалиброванный по разметке этих 33 черновиков.
          </p>
        </Callout>
      </Section>

      <Section title="DeepEval, CI-гейт и prompt management">
        <p>
          DeepEval устроен как pytest: у каждой метрики порог, результат PASS/FAIL с reason, команда возвращает ненулевой код
          при провале — готовый регрессионный гейт в CI.
        </p>
        <CodeBlock
          language="python"
          title="test_rag.py → deepeval test run test_rag.py"
          code={`import pytest
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric
from deepeval.test_case import LLMTestCase

@pytest.mark.parametrize("case", load_golden("golden.json"))
def test_rag(case):
    answer, contexts = rag_answer(case["question"])
    tc = LLMTestCase(input=case["question"], actual_output=answer,
                     expected_output=case["ground_truth"], retrieval_context=contexts)
    assert_test(tc, [FaithfulnessMetric(threshold=0.7), AnswerRelevancyMetric(threshold=0.7)])`}
        />
        <Callout type="warn" title="Неточность в лекции">
          <ul>
            <li>
              <code>rag_eval_phoenix.py</code>: <code>HallucinationMetric</code> требует поле <code>context</code> (эталонный
              контекст), а тест-кейс передаёт только <code>retrieval_context</code> — метрика падает. К тому же у неё{' '}
              <strong>меньше — лучше</strong>: threshold — это максимум, и усреднять её с «больше — лучше» метриками нельзя.
              Для RAG документация DeepEval сама советует <code>FaithfulnessMetric</code>.
            </li>
            <li>Docstring обещает RAGAS ContextPrecision, а в коде считается LLMContextRecall.</li>
            <li>
              Слайд 10 про Prompt Management показывает схему автоматической оптимизации промптов, а не prompt CMS Langfuse.
            </li>
          </ul>
        </Callout>
        <p>
          <Term id="prompt-management">Prompt management</Term> — промпты вне кода, с версиями и метками. Приложение
          запрашивает <code className="break-all">langfuse.get_prompt("rag-answer", label="production")</code>, SDK кеширует его с TTL, а generation
          связывается с версией промпта — в трейсе видно, какая версия что выдала. Опасность — hot-swap: перевесил метку{' '}
          <code>production</code> на новую версию, и прод поменялся без eval. Порядок другой: новая версия → прогон по
          датасету → сравнение с базой → только потом метка.
        </p>
      </Section>

      <ProjectNote>
        <p>
          <code>evals/golden.json</code> — 49 кейсов: 33 на разбор, 15 на ретест, 1 на утечку чужого проекта. Метрики — чистые
          функции в <code className="break-all">apps/api/src/evals/metrics.ts</code>: <code>scoreBinding</code> (класс или законный отказ, раздел у
          дефекта), <code>scoreFaithfulness</code> (структура черновика), <code>scoreRetrieval</code> (hit@1/3/6). В CI идёт
          офлайн-прогон с порогом binding 0,65: константа «всегда <code>cannot_tell</code>» даёт 20/33 = 0,61 и проходила
          прежний порог 0,6. В каждом отчёте записаны коммит и sha256 системных промптов — это и есть версионирование.
        </p>
        <p>
          О слабостях golden говори первым: «Набор синтетический, одно выдуманное ТЗ на 11 фрагментов, кейсы и промпт писал
          один автор, промпт правили на тех же кейсах, отложенной выборки нет. Поэтому golden у нас — регрессионный гейт,
          а не оценка качества на проде; для прода смотрим трейсы Langfuse».
        </p>
      </ProjectNote>

      <KeyIdea>
        Golden — из прод-провалов и edge cases, с запретами и допустимым «не знаю», и с отложенной выборкой. Всё, что можно
        проверить кодом, проверяй кодом; LLM-судью — со strict JSON, temperature 0, другой моделью и калибровкой по людям
        через κ. Промпт — версия в CMS, и метка production переезжает только после eval.
      </KeyIdea>
    </>
  )
}

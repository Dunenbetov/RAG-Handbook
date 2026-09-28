import { CircleCheck, FileOutput, FileSearch, GitBranch, Route, ScanText, Scale, SkipForward } from 'lucide-react'
import { Callout, Formula, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { StepPlayer, type Stage } from '../../components/interactive/StepPlayer'

const STAGES: Stage[] = [
  { icon: FileSearch, title: 'pick_pages', detail: 'Выбираем 3 калибровочные страницы разного типа: текст, таблица, график (номера условные). Эвристика PyMuPDF: число символов, картинок, drawings.', example: 'pages = {"text": 4, "table": 9, "chart": 13}\nmethod_queue = ["docling", "vlm"]\ncurrent_method = "pdfplumber"' },
  { icon: ScanText, title: 'calibrate: pdfplumber', detail: 'Самый дешёвый метод извлекает текст только с трёх страниц.', example: 'calibration = {"pdfplumber:4": "...", "pdfplumber:9": "...", "pdfplumber:13": "..."}' },
  { icon: Scale, title: 'judge', detail: 'gpt-5-mini vision получает картинку страницы и извлечённый текст, ставит 1–10 по completeness, structure, accuracy, tables. Таблица развалилась, график потерян.', example: 'scores["pdfplumber"] = [8, 3, 2]  # avg 4.3\njudge_calls = 3' },
  { icon: GitBranch, title: 'escalate', detail: 'Условное ребро после judge читает decision. Среднее ниже 7, в очереди есть методы — эскалация.', example: 'decision = "escalate"  →  next_method' },
  { icon: SkipForward, title: 'next_method', detail: 'Берём следующий метод из очереди, по возрастанию цены.', example: 'current_method = "docling"\nmethod_queue = ["vlm"]' },
  { icon: ScanText, title: 'calibrate: docling', detail: 'AI-парсер на тех же трёх страницах.', example: 'calibration += {"docling:4": "...", "docling:9": "...", "docling:13": "..."}' },
  { icon: Scale, title: 'judge', detail: 'Ещё 3 вызова судьи. Таблица распознана, минимум по страницам в норме.', example: 'scores["docling"] = [9, 8, 7]  # avg 8.0, min 7\njudge_calls = 6' },
  { icon: CircleCheck, title: 'accept', detail: 'avg ≥ 7 и min ≥ 5 — принимаем текущий метод. VLM не пробовали: сэкономили 3 вызова судьи.', example: 'decision = "accept"  →  parse_all' },
  { icon: FileOutput, title: 'parse_all', detail: 'Весь документ парсится победившим методом без судьи. Один .md с разделителями страниц.', example: 'output.md: <!-- page 1 --> ... <!-- page 15 -->\nwinner = "docling", judge_calls = 6 (v1: 9)' },
]

export default function Lesson() {
  return (
    <>
      <Section title="Зачем калибровка">
        <p>
          Оценивать каждую страницу <Term id="vlm">VLM</Term>-судьёй дорого: 50 страниц — это 50+ vision-вызовов. Поэтому метод
          выбирается на 3 калибровочных страницах, а весь документ парсится выбранным методом без судьи. Методы: pdfplumber или
          PyMuPDF (baseline), <Term id="docling">docling</Term> или LlamaParse (AI-парсер), VLM на gpt-5-mini. Судья —
          gpt-5-mini vision, ответ строго в JSON.
        </p>
        <Tbl
          head={['', 'v1: калибровка', 'v2: эскалация']}
          rows={[
            ['Граф', 'линейный: pick_pages → calibrate → judge → select_best → parse_all', 'условное ребро после judge, цикл через next_method → calibrate'],
            ['Проб', 'все 3 метода × 3 страницы', 'текущий метод × 3 страницы, старт с pdfplumber'],
            ['Вызовов судьи', 'всегда 9', '3 / 6 / 9'],
            ['Выбор', 'лучший средний балл, при равенстве дешевле', 'первый метод с avg ≥ 7; методы кончились — select_best из попробованных'],
          ]}
        />
        <Callout type="warn" title="Неточность в ТЗ">
          <p>
            В v2 в разделе «Что сдать» написано «StateGraph с 5 нодами», а по схеме их 6: добавилась <code>next_method</code>. Это
            копипаст из v1.
          </p>
        </Callout>
      </Section>

      <Section title="Путь v2: pdfplumber проваливается, docling проходит">
        <StepPlayer title="Extractor v2: эскалация методов" icon={Route} stages={STAGES} />
        <CodeBlock
          language="python"
          title="Граф v2 (реконструкция по ТЗ)"
          code={`g = StateGraph(ExtractorState)
for name, fn in [("pick_pages", pick), ("calibrate", calibrate), ("judge", judge),
                 ("next_method", next_method), ("select_best", select_best), ("parse_all", parse_all)]:
    g.add_node(name, fn)
g.add_edge(START, "pick_pages"); g.add_edge("pick_pages", "calibrate")
g.add_edge("calibrate", "judge")
g.add_conditional_edges("judge", lambda s: s["decision"],
    {"accept": "parse_all", "escalate": "next_method", "exhausted": "select_best"})
g.add_edge("next_method", "calibrate"); g.add_edge("select_best", "parse_all")
g.add_edge("parse_all", END)
app = g.compile()`}
        />
      </Section>

      <Section title="State и ловушки">
        <CodeBlock
          language="python"
          title="State: строковые ключи и reducers"
          code={`class ExtractorState(TypedDict):
    pdf_path: str
    pages: dict[str, int]              # тип страницы -> номер
    method_queue: list[str]            # ещё не попробованные, по цене
    current_method: str
    calibration: Annotated[dict[str, str], operator.or_]         # "docling:9" -> текст
    scores: Annotated[dict[str, list[float]], operator.or_]      # метод -> баллы страниц
    judge_calls: Annotated[int, operator.add]
    decision: Literal["accept", "escalate", "exhausted"]

def route(s, pts):   # внутри judge
    ok = sum(pts) / len(pts) >= 7 and min(pts) >= 5    # гейт по минимуму
    return "accept" if ok else ("escalate" if s["method_queue"] else "exhausted")

judge_llm = ChatOpenAI(model="gpt-5-mini", reasoning_effort="minimal")  # без temperature`}
        />
        <ul>
          <li>
            <strong>Ключи-кортежи</strong> <code>{`{(method, page): ...}`}</code> из ТЗ не сериализуются в JSON и ломают checkpointer и
            трейс в Langfuse. Бери <code>{`f"{method}:{page}"`}</code> или вложенный dict.
          </li>
          <li>
            <strong>Без reducer</strong> нода, вернувшая <code>calibration</code>, перезапишет его целиком, и результаты pdfplumber
            пропадут. <code>operator.or_</code> сливает словари.
          </li>
          <li>
            <strong>Среднее скрывает провал таблицы</strong>: 10 + 2 + 9 даёт avg 7, и метод принят со сломанной таблицей. Нужен гейт
            по минимуму или отдельный порог по критерию tables.
          </li>
          <li>
            <strong>Векторная графика</strong> не видна эвристике «число картинок»: на стр. 6 отчёта «Эйр Астаны» 540 drawings при 1
            картинке. Смотри <code>page.get_drawings()</code> и <code>page.find_tables()</code>.
          </li>
          <li>
            <strong>gpt-5-mini — reasoning-модель</strong>: <code>temperature</code> не передавай (принимается только значение по
            умолчанию), <code>reasoning_effort</code> у gpt-5-mini — minimal / low / medium / high (набор значений зависит от
            модели: у gpt-5.1 и новее есть none). Судья на той же модели,
            что и VLM-метод, склонен ей подыгрывать.
          </li>
        </ul>
        <Callout type="info" title="light_test.pdf: ветка exhausted">
          <p>
            Заголовки набраны шрифтом без кириллицы: вместо букв «······» <strong>и в текстовом слое, и на картинке</strong>, поэтому
            восстановить их не может ни один метод, и порог не пройдёт никто — ветка exhausted, <code>select_best</code>. Строки
            выходят за край страницы (x до 700 при ширине 595): pdfplumber извлекает невидимый хвост, а VLM его не видит. Судья,
            сверяющий текст с картинкой, может наказать pdfplumber за «лишний» текст — так проверяется честность судьи.
          </p>
        </Callout>
      </Section>

      <Section title="Langfuse и экономия вызовов">
        <CodeBlock
          language="python"
          title="Средние баллы методов — scores на трейс"
          code={`lf = get_client()
with lf.start_as_current_observation(as_type="span", name="extractor-v2") as span:
    out = app.invoke({"pdf_path": path}, config={"callbacks": [CallbackHandler()]})
    for method, pts in out["scores"].items():
        span.score_trace(name=f"avg_{method}", value=sum(pts) / len(pts))
lf.flush()`}
        />
        <Formula note="M — число методов, k — сколько попробовано, N — страниц в документе">
          v1 = 3·M = 9 · v2 = 3·k ∈ {'{3, 6, 9}'} · судья на каждой странице = N
        </Formula>
        <p>
          На 50-страничном документе калибровка экономит 41–47 вызовов судьи по сравнению с проверкой каждой страницы, а v2 против v1
          — до 6. Развитие идеи: выбирать метод по типу страницы — текст pdfplumber, таблицы docling, графики VLM.
        </p>
      </Section>

      <ProjectNote>
        <p>
          В remark-round та же идея «дешёвый путь, модель только при необходимости» стоит в графе ретеста{' '}
          <code>apps/api/src/agent/retest.graph.ts</code>: <code>pixel_diff</code> сначала сравнивает кадры алгоритмом, и
          одинаковые или несопоставимые кадры идут в <code>apply_retest</code> без вызова модели. Используй эту параллель, если
          спросят про цену vision.
        </p>
      </ProjectNote>

      <KeyIdea>
        Extractor v2 — self-reflection через условное ребро: дешёвый метод, судья на 3 страницах, эскалация только при провале.
        Гейт по минимуму вместо одного среднего, JSON-сериализуемый State с reducers и честный подсчёт вызовов судьи — это то, о
        чём спросят.
      </KeyIdea>
    </>
  )
}

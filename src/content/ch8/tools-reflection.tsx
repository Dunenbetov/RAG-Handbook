import { Link } from 'react-router-dom'
import { Callout, KeyIdea, No, ProjectNote, Section, Tbl, Warn, Yes } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Кто решает маршрут">
        <p>
          Мантра лекции: «LLM предлагает (tool_calls), route_fn решает, LangGraph исполняет». Полезно как схема, но вывод
          «LLM сама не решает, куда идти» неверен. Точнее так: <strong>граф задаёт разработчик, а LLM влияет на маршрут
          ровно настолько, насколько ты ей это позволил</strong>. Рычагов три:
        </p>
        <Tbl
          head={['Механизм', 'Кто фактически выбирает', 'Пример']}
          rows={[
            [<>tool_calls + <code>tools_condition</code></>, 'LLM: есть вызов — идём в tools, нет — END', 'ReAct-цикл agent ↔ tools'],
            ['Route-функция по выходу LLM', 'Код, но по данным модели', 'score < 0,45 → rewrite'],
            [<code key="c">Command(goto=...)</code>, 'Узел; внутри может спросить LLM', 'supervisor возвращает Command(goto="coder")'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Supervisor из той же лекции (<code>lambda s: s["next_agent"]</code>) — это маршрутизация силами LLM, то есть
            прямой контрпример к «LLM не решает». Второй баг: промпт супервизора не упоминает вариант{' '}
            <code>"done"</code>, модель его не вернёт, и граф крутится до <code>GraphRecursionError</code>. А ответ
            «Coder.» с точкой ломает маршрут. Лечится structured output с <code>Literal["coder", "reviewer", "done"]</code>{' '}
            и счётчиком шагов в State.
          </p>
        </Callout>
      </Section>

      <Section title="Tool calling в графе: ToolNode и tools_condition">
        <p>
          <Term id="tool-calling">Tool calling</Term>: модель, получившая схемы tools через <code>bind_tools</code>,
          возвращает <code>AIMessage.tool_calls</code>. Их исполняет узел tools и кладёт результаты обратно как{' '}
          <code>ToolMessage</code>. Рукописные <code>tool_executor</code> и <code>route_after_generator</code> из лекции
          повторяют готовые компоненты:
        </p>
        <CodeBlock
          language="python"
          title="ReAct-цикл из prebuilt-компонентов"
          code={`from langgraph.graph import MessagesState, StateGraph, START
from langgraph.prebuilt import ToolNode, tools_condition

tools = [search_docs, get_weather]
llm_with_tools = llm.bind_tools(tools)

def agent(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

g = StateGraph(MessagesState)
g.add_node("agent", agent)
g.add_node("tools", ToolNode(tools))            # исполнит ВСЕ tool_calls
g.add_edge(START, "agent")
g.add_conditional_edges("agent", tools_condition)  # есть tool_calls → "tools", иначе END
g.add_edge("tools", "agent")
app = g.compile()`}
        />
        <Callout type="danger" title="Каждому tool_call — свой ToolMessage">
          <p>
            Модель может вернуть несколько параллельных tool_calls. Showcase-скрипт семинара исполняет только{' '}
            <code>tool_calls[0]</code>: остальные остаются без ответа, и на следующем вызове OpenAI возвращает 400 —
            API требует ToolMessage с совпадающим <code>tool_call_id</code> на каждый вызов. <code>ToolNode</code>{' '}
            исполняет все сам.
          </p>
        </Callout>
        <p>
          Если нужен именно агент без своего графа, в LangChain v1 для этого есть <code>create_agent</code> из{' '}
          <code>langchain.agents</code> (в JS — <code>createAgent</code> из пакета <code>langchain</code>). Он работает
          поверх LangGraph и расширяется middleware, например <code>HumanInTheLoopMiddleware</code>. Старый{' '}
          <code>create_react_agent</code> из <code>langgraph.prebuilt</code> в LangGraph v1 помечен deprecated.
        </p>
      </Section>

      <Section title="Self-reflection = evaluator-optimizer">
        <p>
          Генератор пишет черновик, критик оценивает: плохо — на переделку, хорошо — дальше. По таксономии Anthropic это
          паттерн <Term id="evaluator-optimizer">evaluator-optimizer</Term>. Главный вопрос — кто критик:
        </p>
        <Tbl
          head={['Критик', 'Плюсы', 'Минусы']}
          rows={[
            ['Та же LLM, другой промпт', <><Yes />дёшево, просто</>, <><No />слепа к своим ошибкам, склонна хвалить себя</>],
            ['Другая (сильнее) LLM', <><Yes />ловит больше</>, <><Warn />дороже, латентность, сама нуждается в калибровке</>],
            ['Код: схема, линтер, тесты, регулярки', <><Yes />детерминирован, бесплатен, воспроизводим</>, <><No />проверяет форму, а не смысл</>],
            ['Комбинация', <><Yes />код отсекает брак дёшево, LLM смотрит смысл</>, <><Warn />сложнее отлаживать</>],
          ]}
        />
        <Callout type="info" title="Чего лекция не сказала">
          <p>
            Huang et al. (2023, «LLMs cannot self-correct reasoning yet») показали, что самокоррекция без внешнего
            сигнала часто не помогает, а иногда ухудшает ответ. Рефлексия реально работает, когда у критика есть{' '}
            <strong>внешняя обратная связь</strong>: тесты, валидатор схемы, документы-источники. Поэтому она полезна для
            кода, строгих форматов (JSON, SQL) и фактчекинга по документам и почти бесполезна для простого Q&amp;A.
          </p>
        </Callout>
      </Section>

      <Section title="Fail-closed, structured output и лимит итераций">
        <p>
          Три правила надёжного критика. <strong>Structured output</strong> вместо маршрутизации по подстрокам
          (<code>"needs_improvement" in content</code> ломается от любой перефразировки). <strong>Лимит итераций в
          State</strong> (лекция: 2–5) плюс <code>recursion_limit</code> как страховка. <Term id="fail-closed">Fail-closed</Term>:
          если проверка сломалась, результат считается <em>не</em> прошедшим.
        </p>
        <CodeBlock
          language="python"
          title="Критик: схема, fail-closed, эскалация по лимиту"
          code={`from typing import Literal
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

class Critique(BaseModel):
    verdict: Literal["pass", "revise"]
    feedback: str

critic = ChatOpenAI(model="gpt-4.1-mini", temperature=0).with_structured_output(Critique)
MAX_ITERS = 3

def reflect(state):
    try:
        c = critic.invoke(critic_prompt(state))
    except Exception:                      # сбой API или парсинга
        c = Critique(verdict="revise", feedback="critic_failed")  # fail-closed
    return {"critique": c.model_dump(), "iterations": state["iterations"] + 1}

def after_reflect(state) -> str:
    if state["critique"]["verdict"] == "pass":
        return "done"
    return "human_review" if state["iterations"] >= MAX_ITERS else "revise"`}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            В <code>agent_advanced.py</code> при ошибке парсинга JSON критика ставится{' '}
            <code>{'{"score": 8, "quality": "good"}'}</code> — это fail-open: сломанный критик пропускает любой ответ.
            К тому же после рефлектора нет лимита повторов, и цикл generator ↔ reflector живёт до{' '}
            <code>GraphRecursionError</code>, а в свежих версиях Python дефолтный лимит — 1000+ шагов, то есть сотни
            вызовов модели. Правильно — провал проверки по умолчанию и эскалация к человеку после N
            попыток.
          </p>
        </Callout>
        <Callout type="tip" title="Вопрос на защите: почему не createAgent (бывший createReactAgent) с tool search_spec?">
          <p>
            «Каждая карточка обязана пройти одинаковый путь: поиск → привязка → класс → черновик → проверка опоры. ReAct-агент
            может пропустить поиск, зациклиться или вызвать tool десять раз, и цена станет непредсказуемой. У меня потолок —
            9 вызовов модели, и путь любой карточки воспроизводится в Langfuse. Там, где свобода полезна, она есть: Claude
            Code сам зовёт <code>search_spec</code> через MCP».
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          Критик в remark-round — <strong>код</strong>: <code>apps/api/src/agent/faithfulness.ts</code> регулярками ловит
          ссылку на § без цитаты, «на кадре» без кадра и дефект без опоры. Провал возвращает в{' '}
          <code>bind_to_clause</code> (не больше <code>MAX_BIND_LOOPS=2</code>), на третьем провале код сам ставит{' '}
          <code>cannot_tell</code> — это fail-closed. В <code>apps/api/src/llm/openai-triage-llm.ts</code> classify
          идёт через strict JSON Schema, а поверх схемы код правит семантику: неизвестный класс превращается в{' '}
          <code>unspecified</code>, дефект без цитаты — тоже. Честная оговорка: критик проверяет структуру, а не качество
          текста; LLM-судьи нет (см. <Link to="/ch9/evals" className="text-accent hover:underline">урок про LLM-as-judge</Link>).
        </p>
      </ProjectNote>

      <KeyIdea>
        LLM рулит маршрутом настолько, насколько ты позволил: через tool_calls, route по её выходу или Command.
        ToolNode обязан ответить на каждый tool_call. Рефлексия — это evaluator-optimizer, и работает она при внешнем
        сигнале. Критик должен быть fail-closed, со structured output и лимитом итераций в State.
      </KeyIdea>
    </>
  )
}

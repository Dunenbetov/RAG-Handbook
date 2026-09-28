import { Bot, Flag, GitBranch, Play, Wrench } from 'lucide-react'
import { Callout, KeyIdea, ProjectNote, Section, Tbl } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'
import { StepPlayer, type Stage } from '../../components/interactive/StepPlayer'

const STAGES: Stage[] = [
  { icon: Play, title: 'invoke', detail: 'Вход становится начальным State. Ключи с reducer стартуют с пустого значения: список пуст, стоимость 0. У status без reducer и default значения нет, пока его не запишет узел.', example: 'messages:   [Human("Погода в Алматы и курс USD?")]\ntotal_cost: 0\nstatus:     (нет значения)' },
  { icon: Bot, title: 'agent #1', detail: 'Узел вернул частичный dict. add_messages дописал AIMessage с двумя tool_calls, operator.add прибавил цену, status перезаписан.', example: 'return {messages: [AI(tool_calls=[weather, rate])],\n        total_cost: 0.0004, status: "calling_tools"}\n\nmessages:   [Human, AI(tool_calls x2)]\ntotal_cost: 0.0004\nstatus:     "calling_tools"' },
  { icon: GitBranch, title: 'route', detail: 'Условное ребро: route-функция читает State и возвращает метку. State не меняет, отдельного супершага нет.', example: 'route(state) -> "use_tool"\npath_map: {"use_tool": "tools", "done": END}' },
  { icon: Wrench, title: 'tools', detail: 'Оба tool_calls исполнены, на каждый — ToolMessage с тем же tool_call_id. total_cost узел не вернул, значит, ключ не тронут.', example: 'return {messages: [Tool(tool_call_id=call_1), Tool(tool_call_id=call_2)],\n        status: "tools_done"}\n\nmessages:   [Human, AI, Tool, Tool]\ntotal_cost: 0.0004\nstatus:     "tools_done"' },
  { icon: Bot, title: 'agent #2', detail: 'Модель видит результаты tools и отвечает текстом без tool_calls. Цена суммируется, status снова перезаписан.', example: 'messages:   [Human, AI, Tool, Tool, AI("+28°C, 1 USD = ...")]\ntotal_cost: 0.0010   # 0.0004 + 0.0006\nstatus:     "done"' },
  { icon: Flag, title: 'END', detail: 'route вернул "done" → END. Было 3 супершага (agent, tools, agent). С checkpointer после каждого лёг бы снимок State.', example: 'route(state) -> "done" -> END\ninvoke() возвращает финальный State' },
]

export default function Lesson() {
  return (
    <>
      <Section title="State — общая память графа">
        <p>
          <Term id="stategraph">StateGraph</Term> — билдер графа, параметризованный схемой State. В Python это{' '}
          <code>TypedDict</code>, Pydantic-модель или dataclass, в JS — <code>Annotation.Root</code>. Узел — обычная
          функция: получает <strong>весь</strong> State, а возвращает <strong>только изменения</strong> — частичный dict.
          Встроенных «Agent node» или «Reflector node» нет: generator, critic, supervisor — это паттерны, а не классы.
        </p>
        <p>
          Как частичное обновление сливается со старым значением, решает <Term id="reducer">reducer</Term> —
          функция, которую вешают на ключ через <code>Annotated[type, reducer]</code>.
        </p>
        <Tbl
          head={['Ключ', 'Reducer', 'Что делает']}
          rows={[
            [<code key="k">status: str</code>, 'нет', 'Last-write-wins: новое значение перезаписывает старое'],
            [<code key="k">messages</code>, <code key="r">add_messages</code>, 'Дописывает новые, заменяет сообщение с тем же id, удаляет через RemoveMessage, приводит dict и tuple к Message'],
            [<code key="k">total_cost: float</code>, <code key="r">operator.add</code>, 'Складывает числа или конкатенирует списки'],
            ['любой', 'своя функция (old, new) → value', 'Мерж словарей, дедупликация, top-k'],
          ]}
        />
        <Callout type="warn" title="Неточность в лекции">
          <p>
            «add_messages просто дописывает» — не совсем. Он мержит <strong>по id сообщения</strong>: сообщение с уже
            существующим id заменяет старое. Поэтому им же правят историю (переписать ответ) и чистят её через{' '}
            <code>RemoveMessage(id=...)</code>.
          </p>
        </Callout>
        <Callout type="danger" title="Параллельная запись без reducer">
          <p>
            Если два узла одного супершага (fan-out) вернут один и тот же ключ без reducer, LangGraph бросит{' '}
            <code>InvalidUpdateError</code>: непонятно, чьё значение победит. Reducer нужен не только для истории
            сообщений, а для любого ключа, в который пишут параллельно.
          </p>
        </Callout>
      </Section>

      <Section title="Узлы, рёбра, Command">
        <CodeBlock
          language="python"
          title="Граф agent ↔ tools"
          code={`import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]     # мерж по id
    total_cost: Annotated[float, operator.add]  # сумма
    status: str                                 # last-write-wins

def route(state: AgentState) -> str:
    return "use_tool" if state["messages"][-1].tool_calls else "done"

g = StateGraph(AgentState)
g.add_node("agent", call_model)
g.add_node("tools", run_tools)
g.add_edge(START, "agent")                      # вместо set_entry_point
g.add_conditional_edges("agent", route, {"use_tool": "tools", "done": END})
g.add_edge("tools", "agent")
app = g.compile()                               # без compile нет invoke/stream
app.invoke({"messages": [("user", "Погода в Алматы?")]}, {"recursion_limit": 10})`}
        />
        <ul>
          <li><code>add_edge(a, b)</code> — после a всегда b. <code>START</code> и <code>END</code> — служебные узлы.</li>
          <li><code>add_conditional_edges(a, fn, path_map)</code> — fn возвращает метку, path_map переводит её в имя узла. Без path_map fn должна вернуть имя узла сама, но тогда граф хуже рисуется.</li>
          <li><code>Command(goto=..., update=...)</code> — узел сам выбирает следующий шаг и сразу обновляет State, без conditional edge. Возвращаемый тип аннотируют <code>Command[Literal["agent", "__end__"]]</code>, чтобы граф знал возможные переходы.</li>
        </ul>
        <Callout type="info" title="Уточнение к лекции">
          <p>
            <code>set_entry_point("agent")</code> из лекции работает и равносилен <code>add_edge(START, "agent")</code>, но
            документация называет рекомендуемым второй вариант: вход и выход задаются так же, как остальные рёбра.
          </p>
        </Callout>
        <CodeBlock
          language="typescript"
          title="То же на LangGraph.js (как в remark-round)"
          code={`import { Annotation, StateGraph, START, END, messagesStateReducer } from '@langchain/langgraph'
import type { AIMessage, BaseMessage } from '@langchain/core/messages'

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({ reducer: messagesStateReducer, default: () => [] }),
  totalCost: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
  status: Annotation<string>,                    // без reducer: last-write-wins
})

const route = (s: typeof AgentState.State) =>
  (s.messages.at(-1) as AIMessage).tool_calls?.length ? 'tools' : END

export const app = new StateGraph(AgentState)
  .addNode('agent', callModel)
  .addNode('tools', runTools)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', route, ['tools', END])   // path map массивом
  .addEdge('tools', 'agent')
  .compile()`}
        />
      </Section>

      <Section title="Прогон по шагам: как меняется State">
        <p>
          Прокрути граф agent → tools → agent → END. Следи за тремя ключами: <code>messages</code> растёт,{' '}
          <code>total_cost</code> суммируется, <code>status</code> перезаписывается.
        </p>
        <StepPlayer title="StateGraph: снимок State после каждого узла" icon={GitBranch} stages={STAGES} />
        <p>
          Под капотом рантайм устроен по модели Pregel: выполнение идёт <strong>супершагами</strong>, узлы одного
          супершага работают параллельно, обновления сливаются reducers, после супершага пишется checkpoint.
        </p>
      </Section>

      <Section title="Циклы и recursion_limit">
        <p>
          Цикл в графе — это просто ребро назад. Чтобы он не стал бесконечным, нужны два предохранителя:
        </p>
        <ul>
          <li><strong>Бизнес-лимит в State</strong>: счётчик (<code>iterations</code>, <code>rewrite_count</code>), который проверяет route-функция. Это штатный выход: «после 2 попыток — эскалация».</li>
          <li><strong>recursion_limit</strong> — аварийный: максимум супершагов за один invoke. При превышении — <code>GraphRecursionError</code>. Дефолт зависит от версии: в LangGraph.js — 25, в Python с 1.0.6 его подняли с 25 до 1000 и выше. Поэтому задавай явно в config (в JS — <code>recursionLimit</code>), не внутри <code>configurable</code>.</li>
        </ul>
        <Callout type="tip" title="Вопрос на защите: зачем recursionLimit: 80?">
          <p>
            «Худший путь первого прогона — около 23 супершагов: vision, 2 rewrite, 3 круга bind → classify → draft →
            gate, propose, hitl. Дефолт LangGraph.js 25 впритык, поэтому 80 — с запасом. Но штатно циклы режут лимиты в State:{' '}
            <code>MAX_REWRITES=2</code> и <code>MAX_BIND_LOOPS=2</code>. recursionLimit — страховка от бага в
            route-функции, а не механизм остановки».
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          <code>apps/api/src/agent/graph-state.ts</code>: <code>TriageState = Annotation.Root</code>, и почти у
          всех полей reducer <code>last</code> — явный last-write-wins. Параллельных нод в графе нет, поэтому{' '}
          <code>InvalidUpdateError</code> не грозит. Хитрый момент: найденные чанки (<code>hits</code>) после rewrite
          мержит сама нода <code>retrieve_docs</code>, а не конкатенирующий reducer. Причина: по кнопке «Не та
          цитата» нода <code>hitl</code> должна <strong>обнулить</strong> <code>hits: []</code>, а через reducer-сумму
          сбросить список нельзя. Граф собирается в <code>triage.graph.ts</code> цепочкой{' '}
          <code>addNode / addConditionalEdges(..., [...])</code>.
        </p>
      </ProjectNote>

      <KeyIdea>
        State — общая память, узел возвращает только изменения, reducer решает, как их слить: перезаписать,
        дописать по id или сложить. Рёбра бывают обычные, условные (route + path_map) и Command(goto) из узла. Циклы
        останавливает счётчик в State, а recursion_limit — последняя страховка.
      </KeyIdea>
    </>
  )
}

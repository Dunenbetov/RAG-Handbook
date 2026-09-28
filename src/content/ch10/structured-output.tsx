import { Callout, KeyIdea, ProjectNote, Section, Steps, VS } from '../../components/ui'
import { Term } from '../../components/Term'
import { CodeBlock } from '../../components/CodeBlock'

export default function Lesson() {
  return (
    <>
      <Section title="Лестница надёжности: от «верни JSON» до strict">
        <p>
          Извлечение (extraction) и классификация в LLM-системах — это почти всегда «текст на входе → объект на выходе». Способов
          получить объект четыре, и они сильно отличаются по гарантиям.
        </p>
        <Steps
          items={[
            { title: '«Верни JSON» в промпте', body: 'Best effort. Модель оборачивает ответ в ```json, пропускает поля, добавляет лишние. Судья из кода лекции разбирает ответ через split("```") — так делать не надо.' },
            { title: 'JSON mode (json_object)', body: 'Гарантирует синтаксически валидный JSON, но не схему. JSON надо явно попросить в промпте.' },
            { title: <Term id="tool-calling">Function calling</Term>, body: 'Модель заполняет аргументы tool по JSON Schema. Без strict — best effort, со strict: true — по схеме.' },
            { title: <><Term id="structured-outputs">Structured Outputs</Term>: json_schema + strict</>, body: 'Constrained decoding: токены, которые нарушили бы схему, модель сгенерировать не может. Ответ совпадает со схемой.' },
          ]}
        />
      </Section>

      <Section title="Что strict гарантирует, а что нет">
        <VS
          left={{
            title: 'Гарантирует',
            tone: 'good',
            children: (
              <ul>
                <li>JSON распарсится</li>
                <li>типы полей, все required на месте</li>
                <li>значения из enum, нет лишних полей</li>
                <li>ограничения схемы: pattern, minimum / maximum, minItems / maxItems</li>
              </ul>
            ),
          }}
          right={{
            title: 'Не гарантирует',
            tone: 'bad',
            children: (
              <ul>
                <li>семантику: класс может быть неверным</li>
                <li>бизнес-правила: «дефект без цитаты»</li>
                <li>связь с контекстом: индекс вне выдачи</li>
                <li>
                  ответ при обрезке по <code>max_tokens</code> (<code>finish_reason: length</code>) и при отказе (<code>message.refusal</code>)
                </li>
              </ul>
            ),
          }}
        />
        <p>
          Strict поддерживает подмножество JSON Schema: корень — object (не anyOf), <strong>все</strong> поля в{' '}
          <code>required</code>, <code>additionalProperties: false</code> у каждого объекта. Необязательное поле делают объединением с
          null: <code>{`type: ['integer', 'null']`}</code>. Нужна gpt-4o-mini, gpt-4o-2024-08-06 или модель новее.
        </p>
      </Section>

      <Section title="В коде: Pydantic и JSON Schema">
        <CodeBlock
          language="python"
          title={'Python: with_structured_output вместо split("```")'}
          code={`from typing import Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

class Verdict(BaseModel):
    relevance: int = Field(ge=0, le=10)
    faithfulness: int = Field(ge=0, le=10)
    completeness: int = Field(ge=0, le=10)
    retry_target: Literal["retriever", "analyst", "none"]

judge = ChatOpenAI(model="gpt-4.1-mini", temperature=0).with_structured_output(
    Verdict, method="json_schema", strict=True
)
v = judge.invoke(prompt)                                   # -> Verdict
overall = (v.relevance + v.faithfulness + v.completeness) / 3  # агрегат считает код
decision = "accept" if overall >= 7 else "retry"`}
        />
        <CodeBlock
          language="typescript"
          title="apps/api/src/llm/openai-triage-llm.ts (сокращено)"
          code={`response_format: {
  type: 'json_schema',
  json_schema: {
    name: 'triage_classification',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['proposedClass', 'hitIndexes', 'duplicateOfNumber', 'reason'],
      properties: {
        proposedClass: { type: 'string', enum: CLASSES },
        hitIndexes: { type: 'array', items: { type: 'integer' } },
        duplicateOfNumber: { type: ['integer', 'null'] },
        reason: { type: 'string' },
      },
    },
  },
},
// ...после ответа — правила поверх схемы:
let proposedClass = CLASSES.includes(raw.proposedClass) ? raw.proposedClass : 'unspecified'
const chunkIds = [...new Set((raw.hitIndexes ?? [])
  .map((i) => input.hits[i]?.chunkId)                  // индекс вне выдачи → undefined
  .filter((x): x is string => Boolean(x)))]
if (proposedClass === 'defect_candidate' && chunkIds.length === 0) proposedClass = 'unspecified'`}
        />
        <p>
          В TypeScript схему можно не писать руками: <code>zodResponseFormat(Schema, 'name')</code> из{' '}
          <code>openai/helpers/zod</code> плюс <code>chat.completions.parse()</code> вернут типизированный{' '}
          <code>message.parsed</code>.
        </p>
      </Section>

      <Section title="Валидация, retry и fail-closed">
        <p>Рабочий паттерн — три слоя: схема (strict) → правила в коде → безопасный исход, если правила нарушены.</p>
        <CodeBlock
          language="python"
          title="Retry с текстом ошибки и лимитом"
          code={`def classify_safe(messages, hits, max_retries=2):
    for _ in range(max_retries + 1):
        out = classifier.invoke(messages)
        err = check_rules(out, hits)     # None или "дефект без цитаты", "индекс 7 вне выдачи"
        if err is None:
            return out
        messages = messages + [("user", f"Ответ нарушил правило: {err}. Исправь.")]
    return Triage(label="cannot_tell", hit_indexes=[], reason="fail-closed")`}
        />
        <ul>
          <li>Нарушение, которое можно исправить детерминированно (понизить класс, отбросить индекс), дешевле править кодом, чем ретраем.</li>
          <li>Retry имеет смысл только с новым входом — текстом ошибки. Лимит 1–2, иначе платишь за петлю.</li>
          <li>
            <strong>Fail-closed</strong>: при сбое — безопасный исход (решает человек), а не «accept».
          </li>
        </ul>
        <Callout type="warn" title="Неточность в лекции">
          <p>
            Судья из кода недели при ошибке разбора JSON возвращает <strong>accept</strong> — это fail-open: сломанный ответ
            пропускает плохой результат. Итоговый <code>overall</code> считает сама LLM, хотя его должен считать код из отдельных
            оценок. Генератор и судья — одна модель, отсюда self-preference bias (подробнее про смещения{' '}
            <Term id="llm-judge">LLM-judge</Term> — в главе 9).
          </p>
        </Callout>
        <Callout type="tip" title="Вопрос на защите">
          <p>
            <em>«Что гарантирует strict: true?»</em> — Что ответ распарсится и совпадёт со схемой: четыре поля на месте,{' '}
            <code>proposedClass</code> из enum, <code>hitIndexes</code> — массив целых. Семантику он не гарантирует: модель может
            сослаться на индекс вне выдачи или поставить дефект без опоры, это правят правила в коде после вызова. Отдельные края —
            refusal и обрезка по <code>max_tokens</code>.
          </p>
        </Callout>
      </Section>

      <ProjectNote>
        <p>
          <code>classify</code> в <code>apps/api/src/llm/openai-triage-llm.ts</code>: схема <code>triage_classification</code> со{' '}
          <code>strict: true</code>, затем правила: неизвестный класс → <code>unspecified</code>; <code>hitIndexes</code> вне выдачи
          отбрасываются; дефект без цитаты → <code>unspecified</code>; <code>duplicate</code> без реального оригинала
          переклассифицируется. Retry с текстом ошибки есть на уровне графа: <code>faithfulness_gate</code> возвращает в{' '}
          <code>bind_to_clause</code> с причиной провала в промпте, на третьем провале — <code>cannot_tell</code>. Слабое место:{' '}
          <code>finish_reason</code> и <code>refusal</code> явно не проверяются — при отказе пустой ответ превращается в{' '}
          <code>unspecified</code>, и решение уходит человеку.
        </p>
      </ProjectNote>

      <KeyIdea>
        Strict JSON Schema гарантирует форму, а не смысл. Схема ловит типы и enum, код ловит бизнес-правила и связь с
        контекстом, а при сбое система закрывается в безопасный исход, а не в «accept».
      </KeyIdea>
    </>
  )
}

import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({
  code,
  language = 'python',
  title,
}: {
  code: string
  language?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)
  const trimmed = code.replace(/^\n+|\s+$/g, '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // буфер обмена недоступен — молча пропускаем
    }
  }

  return (
    <div className="group my-6 overflow-hidden rounded-2xl border border-line bg-[#0a0e1f]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-bad/60" />
            <span className="size-2.5 rounded-full bg-warn/60" />
            <span className="size-2.5 rounded-full bg-good/60" />
          </span>
          {title && <span className="ml-2 font-mono text-xs text-muted">{title}</span>}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-ink"
        >
          {copied ? <Check className="size-3.5 text-good" /> : <Copy className="size-3.5" />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
      <Highlight theme={themes.nightOwl} code={trimmed} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="overflow-x-auto p-4 font-mono text-[13.5px] leading-relaxed"
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

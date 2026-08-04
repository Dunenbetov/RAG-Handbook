import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Cable, Database, Globe, Monitor, Server } from 'lucide-react'

type NodeId = 'host' | 'client1' | 'client2' | 'client3' | 'server1' | 'server2' | 'server3'

const NODES: Record<
  NodeId,
  { label: string; sub: string; icon: typeof Bot; x: number; y: number }
> = {
  host: { label: 'MCP Host', sub: 'Cursor, Claude Desktop, IDE', icon: Monitor, x: 50, y: 12 },
  client1: { label: 'MCP Client 1', sub: 'Dedicated connection', icon: Cable, x: 18, y: 45 },
  client2: { label: 'MCP Client 2', sub: 'Dedicated connection', icon: Cable, x: 50, y: 45 },
  client3: { label: 'MCP Client 3', sub: 'Dedicated connection', icon: Cable, x: 82, y: 45 },
  server1: { label: 'Server A', sub: 'Local · STDIO', icon: Server, x: 18, y: 82 },
  server2: { label: 'Server B', sub: 'Local · Filesystem', icon: Database, x: 50, y: 82 },
  server3: { label: 'Server C', sub: 'Remote · HTTP', icon: Globe, x: 82, y: 82 },
}

/** Строго 1:1: один client — один server */
const EDGES: [NodeId, NodeId][] = [
  ['host', 'client1'],
  ['host', 'client2'],
  ['host', 'client3'],
  ['client1', 'server1'],
  ['client2', 'server2'],
  ['client3', 'server3'],
]

const DETAILS: Record<NodeId, string> = {
  host: 'Приложение с LLM: управляет сессиями, собирает контекст, решает когда вызывать tools. Один host создаёт отдельный client на каждый подключённый server.',
  client1: 'Первое dedicated-соединение host → server. Изолированная сессия: JSON-RPC только с Server A.',
  client2: 'Второе соединение 1:1. Host может держать несколько clients параллельно — каждый независим.',
  client3: 'Третье соединение 1:1. Часто ведёт к remote server (Streamable HTTP): Context7, Figma, Sentry в облаке.',
  server1: 'Локальный процесс через STDIO: stdin/stdout, JSON-RPC 2.0. Типично для FastMCP и dev-tools.',
  server2: 'Ещё один локальный server: filesystem, Postgres, notes. Отдельный процесс, свой client.',
  server3: 'Remote server по Streamable HTTP: масштабируется, может обслуживать несколько clients. Требует MCP-Protocol-Version header.',
}

const MOBILE_GROUPS: { title: string; ids: NodeId[] }[] = [
  { title: 'Host', ids: ['host'] },
  { title: 'Clients (1:1)', ids: ['client1', 'client2', 'client3'] },
  { title: 'Servers', ids: ['server1', 'server2', 'server3'] },
]

function neighborsOf(node: NodeId): Set<NodeId> {
  const set = new Set<NodeId>([node])
  for (const [a, b] of EDGES) {
    if (a === node) set.add(b)
    if (b === node) set.add(a)
  }
  return set
}

function NodeDetail({ active }: { active: NodeId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-line bg-surface-2/60 p-4"
      >
        <div className="mb-1 flex items-center gap-2 font-semibold text-title">
          <Bot className="size-4 text-accent" />
          {NODES[active].label}
        </div>
        <p className="text-[14px] leading-relaxed text-ink/85">{DETAILS[active]}</p>
      </motion.div>
    </AnimatePresence>
  )
}

export function MCPTopologyMap() {
  const [active, setActive] = useState<NodeId>('host')
  const pathSet = useMemo(() => neighborsOf(active), [active])

  return (
    <div className="card my-8 overflow-hidden">
      <div className="border-b border-line bg-surface-2/60 px-5 py-3 text-sm font-semibold text-title">
        Топология MCP: Host → Client → Server (1:1)
      </div>
      <div className="p-5">
        {/* компактный список на узких экранах */}
        <div className="mb-4 space-y-4 sm:hidden">
          {MOBILE_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{group.title}</div>
              <div className="space-y-2">
                {(group.ids as NodeId[]).map((id) => {
                  const n = NODES[id]
                  const Icon = n.icon
                  const isActive = active === id
                  const onPath = pathSet.has(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActive(id)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? 'border-accent bg-accent/15'
                          : onPath
                            ? 'border-accent/50 bg-accent/5'
                            : 'border-line bg-surface'
                      }`}
                    >
                      <Icon className={`size-4 shrink-0 ${isActive || onPath ? 'text-accent' : 'text-muted'}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-title">{n.label}</div>
                        <div className="text-xs text-muted">{n.sub}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* карта на sm+ */}
        <div className="relative mb-4 hidden aspect-[16/10] rounded-xl border border-line bg-surface-2/30 sm:block">
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {EDGES.map(([a, b]) => {
              const na = NODES[a]
              const nb = NODES[b]
              const onPath = pathSet.has(a) && pathSet.has(b)
              return (
                <motion.line
                  key={`${a}-${b}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={onPath ? '#22d3ee' : 'var(--color-line)'}
                  strokeWidth={onPath ? 0.55 : 0.35}
                  strokeDasharray={onPath ? '0' : '2 2'}
                  vectorEffect="non-scaling-stroke"
                  animate={{ opacity: onPath ? 1 : 0.35 }}
                />
              )
            })}
          </svg>
          {(Object.entries(NODES) as [NodeId, (typeof NODES)[NodeId]][]).map(([id, n]) => {
            const Icon = n.icon
            const isActive = active === id
            const onPath = pathSet.has(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
                className={`absolute z-10 min-w-[72px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-1.5 py-1 text-center transition-all ${
                  isActive
                    ? 'border-accent bg-accent/15 shadow-lg shadow-accent/20'
                    : onPath
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-line bg-surface opacity-55 hover:border-accent/40 hover:opacity-100'
                }`}
              >
                <Icon className={`mx-auto mb-0.5 size-4 ${isActive || onPath ? 'text-accent' : 'text-muted'}`} />
                <div className="text-[10px] font-bold text-title">{n.label}</div>
                <div className="text-[8px] text-muted">{n.sub}</div>
              </button>
            )
          })}
        </div>

        <NodeDetail active={active} />
      </div>
    </div>
  )
}

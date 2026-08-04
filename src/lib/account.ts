import { useSyncExternalStore } from 'react'

/**
 * Контракт хранилища намеренно отделён от UI. Когда появится бэкенд, localStorage-
 * реализацию можно заменить HTTP-адаптером, не меняя компонентов.
 */
export type Account = {
  id: string
  name: string
  email: string
  createdAt: string
}

type AccountState = {
  account: Account | null
  activityDates: string[]
}

const STORAGE_KEY = 'rag-handbook-account-v1'
type Listener = () => void
const listeners = new Set<Listener>()
let cache: AccountState | null = null

function emptyState(): AccountState {
  return { account: null, activityDates: [] }
}

function load(): AccountState {
  if (cache) return cache
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? (JSON.parse(saved) as Partial<AccountState>) : emptyState()
    cache = { account: parsed.account ?? null, activityDates: parsed.activityDates ?? [] }
  } catch {
    cache = emptyState()
  }
  return cache
}

function save(next: AccountState) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Локальный preview остаётся рабочим даже в приватном режиме.
  }
  listeners.forEach((listener) => listener())
}

function dayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function signInLocal({ name, email }: Pick<Account, 'name' | 'email'>) {
  const current = load()
  const cleanName = name.trim() || email.split('@')[0] || 'Ученик'
  save({
    ...current,
    account: {
      id: current.account?.id ?? crypto.randomUUID(),
      name: cleanName,
      email: email.trim().toLowerCase(),
      createdAt: current.account?.createdAt ?? new Date().toISOString(),
    },
  })
}

export function signOutLocal() {
  save({ ...load(), account: null })
}

/** Вызывается при учебном действии; одна дата считается только один раз. */
export function recordLearningActivity() {
  const current = load()
  const today = dayKey()
  if (!current.activityDates.includes(today)) {
    save({ ...current, activityDates: [...current.activityDates, today].sort() })
  }
}

function consecutiveDays(dates: string[]) {
  const set = new Set(dates)
  let cursor = new Date()
  let total = 0
  while (set.has(dayKey(cursor))) {
    total += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return total
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAccount() {
  const state = useSyncExternalStore(subscribe, load)
  return {
    account: state.account,
    activityDates: state.activityDates,
    streak: consecutiveDays(state.activityDates),
    studiedDays: state.activityDates.length,
  }
}

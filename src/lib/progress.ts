import { useSyncExternalStore } from 'react'
import { allLessons } from './curriculum'

const STORAGE_KEY = 'rag-conspect-progress-v1'

type Listener = () => void
const listeners = new Set<Listener>()
let cache: Set<string> | null = null

function load(): Set<string> {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    cache = new Set()
  }
  return cache
}

function save(next: Set<string>) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {
    // приватный режим — прогресс живёт только в памяти
  }
  listeners.forEach((l) => l())
}

export function markDone(key: string) {
  const next = new Set(load())
  next.add(key)
  save(next)
}

export function markUndone(key: string) {
  const next = new Set(load())
  next.delete(key)
  save(next)
}

export function isDone(key: string) {
  return load().has(key)
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Реактивный доступ к прогрессу из компонентов */
export function useProgress() {
  const done = useSyncExternalStore(subscribe, load)
  const total = allLessons.length
  return {
    done,
    total,
    count: done.size,
    percent: Math.round((done.size / total) * 100),
    isDone: (key: string) => done.has(key),
  }
}

import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'rag-theme'

type Listener = () => void
const listeners = new Set<Listener>()
let cache: Theme | null = null

function load(): Theme {
  if (cache) return cache
  try {
    cache = localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    cache = 'dark'
  }
  return cache
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function setTheme(theme: Theme) {
  cache = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // приватный режим — тема живёт только в памяти
  }
  apply(theme)
  listeners.forEach((l) => l())
}

export function toggleTheme() {
  setTheme(load() === 'dark' ? 'light' : 'dark')
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Реактивный доступ к теме из компонентов */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, load)
}

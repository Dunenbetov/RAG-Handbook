import { useState } from 'react'
import type { FormEvent } from 'react'
import { LogIn, X } from 'lucide-react'
import { signInLocal, useAccount } from '../../lib/account'

export function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { account } = useAccount()
  const [name, setName] = useState(account?.name ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  if (!open) return null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    signInLocal({ name, email })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/65" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl shadow-black/40">
        <button type="button" onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 text-muted hover:text-ink"><X className="size-5" /></button>
        <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><LogIn className="size-5" /></div>
        <h2 id="account-title" className="text-xl font-bold text-title">Ваш профиль</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">Сейчас данные сохраняются только на этом устройстве. Позже этот экран подключится к авторизации и синхронизации.</p>
        <label className="mt-5 block text-sm font-medium text-ink">Имя
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Айдана" className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
        </label>
        <button className="btn-primary mt-6 w-full justify-center" type="submit">{account ? 'Сохранить профиль' : 'Продолжить'}</button>
      </form>
    </div>
  )
}

import { Flame, LogOut, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { signOutLocal, useAccount } from '../lib/account'
import { useProgress } from '../lib/progress'

export function ProfilePage({ onOpenAccount }: { onOpenAccount: () => void }) {
  const { account, streak, studiedDays } = useAccount()
  const progress = useProgress()
  const greeting = account?.name || 'Будущий ученик'

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-10 md:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-title">Профиль</h1>
          <p className="mt-2 text-muted">{account ? `Вы учитесь как ${greeting}.` : 'Создайте локальный профиль, чтобы увидеть будущую модель аккаунта.'}</p>
        </div>
        <button onClick={onOpenAccount} className="btn-ghost w-fit">{account ? 'Редактировать' : 'Войти / создать профиль'}</button>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-line p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-xl font-bold text-white">{greeting.slice(0, 1).toUpperCase()}</div>
            <div><div className="font-semibold text-title">{greeting}</div><div className="text-sm text-muted">{account?.email ?? 'Профиль не подключён'}</div></div>
          </div>
        </div>
        <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-5"><Flame className="mb-2 size-5 text-warn" /><div className="text-2xl font-bold text-title">{streak}</div><div className="text-sm text-muted">дней подряд</div></div>
          <div className="p-5"><Sparkles className="mb-2 size-5 text-accent" /><div className="text-2xl font-bold text-title">{studiedDays}</div><div className="text-sm text-muted">дней с занятиями</div></div>
          <div className="p-5"><ShieldCheck className="mb-2 size-5 text-good" /><div className="text-2xl font-bold text-title">{progress.percent}%</div><div className="text-sm text-muted">прогресс курса</div></div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-violet/50 bg-violet/5 p-6">
        <h2 className="font-bold text-title">Готово к подключению сервера</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">Профиль и даты занятий изолированы в хранилище. При появлении бэкенда заменим локальный адаптер на API для входа, облачной синхронизации и общих стриков.</p>
      </section>
      {account && <button onClick={signOutLocal} className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-bad"><LogOut className="size-4" />Выйти с этого устройства</button>}
      {!account && <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">Вернуться к курсу</Link>}
    </div>
  )
}

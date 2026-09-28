import { useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { AccountDialog } from './components/account/AccountDialog'
import { Home } from './pages/Home'
import { LessonPage } from './pages/LessonPage'
import { GlossaryPage } from './pages/GlossaryPage'
import { getChapter } from './lib/curriculum'
import { ProfilePage } from './pages/ProfilePage'

/** /ch1 → первый урок главы */
function ChapterRedirect() {
  const { chapterId = '' } = useParams()
  const chapter = getChapter(chapterId)
  if (!chapter) return <Navigate to="/" replace />
  return <Navigate to={`/${chapter.id}/${chapter.lessons[0].id}`} replace />
}

export default function App() {
  const [accountOpen, setAccountOpen] = useState(false)
  return (
    <HashRouter>
      <Sidebar onOpenAccount={() => setAccountOpen(true)} />
      <main className="lg:pl-72">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/profile" element={<ProfilePage onOpenAccount={() => setAccountOpen(true)} />} />
          <Route path="/:chapterId" element={<ChapterRedirect />} />
          <Route path="/:chapterId/:lessonId" element={<LessonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </HashRouter>
  )
}

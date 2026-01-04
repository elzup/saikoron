import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NewPage } from './pages/NewPage'
import { EditPage } from './pages/EditPage'
import { PlayPage } from './pages/PlayPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="/edit/:id" element={<EditPage />} />
        <Route path="/play/:id" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}

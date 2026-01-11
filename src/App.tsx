import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { NewPage } from './pages/NewPage'
import { PlayPage } from './pages/PlayPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="/play/:id" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}

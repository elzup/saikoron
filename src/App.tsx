import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DiceProvider } from './contexts/DiceContext'
import { DicePage } from './pages/DicePage'
import { HomePage } from './pages/HomePage'
import { ListDrawPage } from './pages/ListDrawPage'
import { SampleMode } from './pages/modes/SampleMode'
import { SignageMode } from './pages/modes/SignageMode'
import { SlotMode } from './pages/modes/SlotMode'
import { WheelMode } from './pages/modes/WheelMode'
import { NewPage } from './pages/NewPage'
import { RandomNumberPage } from './pages/RandomNumberPage'

export function App() {
  return (
    <BrowserRouter>
      <DiceProvider>
        <Layout>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/new' element={<NewPage />} />
            <Route path='/dice/:id' element={<DicePage />} />
            <Route path='/dice/:id/wheel' element={<WheelMode />} />
            <Route path='/dice/:id/slot' element={<SlotMode />} />
            <Route path='/dice/:id/sample' element={<SampleMode />} />
            <Route path='/dice/:id/signage' element={<SignageMode />} />
            {/* backward compat */}
            <Route path='/play/:id' element={<PlayRedirect />} />
            <Route path='/random-number' element={<RandomNumberPage />} />
            <Route path='/list-draw' element={<ListDrawPage />} />
          </Routes>
        </Layout>
      </DiceProvider>
    </BrowserRouter>
  )
}

function PlayRedirect() {
  const id = window.location.pathname.split('/play/')[1]
  return <Navigate to={`/dice/${id}/slot`} replace />
}

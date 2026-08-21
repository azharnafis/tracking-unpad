import { Header } from './components/Header'
import { useHashRoute } from './hooks/useHashRoute'
import { HomePage } from './pages/HomePage'
import { StatusPage } from './pages/StatusPage'
import { SurveyPage } from './pages/SurveyPage'
import { TrackingPage } from './pages/TrackingPage'

export default function App() {
  const { page, kode, navigate } = useHashRoute()

  return (
    <>
      <Header currentPage={page} onNavigate={navigate} />
      {page === 'tracking' && <TrackingPage onNavigate={navigate} />}
      {page === 'status' && <StatusPage kodeTracking={kode} onNavigate={navigate} />}
      {page === 'survey' && <SurveyPage kodeTracking={kode} onNavigate={navigate} />}
      {page === 'home' && <HomePage onNavigate={navigate} />}
    </>
  )
}
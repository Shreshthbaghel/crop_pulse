import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import FarmProfileCard from './components/FarmProfileCard'
import SensorGraphs from './components/SensorGraphs'
import SoilHealthCard from './components/SoilHealthCard'
import WeatherCard from './components/WeatherCard'
import HarvestSchedule from './components/HarvestSchedule'
import Onboarding from './components/Onboarding'
import Recommendations from './pages/Recommendations'
import Alerts from './pages/Alerts'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import Irrigation from './pages/Irrigation'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Simulation from './pages/Simulation'
import SoilInsights from './pages/SoilInsights'
import ArchivePage from './pages/ArchivePage'
import DevStatusBar from './components/DevStatusBar'
import ScenarioInjectors from './components/ScenarioInjectors'
import AIAssistant from './components/AIAssistant'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { MQTTProvider } from './contexts/MQTTContext'
import { AppContext } from './contexts/AppContext'

import { mqttService } from './services/mqttService'

// Context handled in separate file

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen overflow-hidden bg-nature-gradient">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 h-screen relative flex flex-col min-h-0 overflow-y-auto">
        {children}
        <AIAssistant />
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDevMode, setIsDevMode] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(true) 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    const params = new URLSearchParams(window.location.search)
    if (params.get('devmode') === 'true') {
      setIsDevMode(true)
      console.log("%c DEV MODE ACTIVE ", "background: #15803d; color: #fff; font-weight: bold;");
    }

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      const checkProfile = async () => {
        setProfileLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('soil_type')
          .eq('id', session.user.id)

        // If profile doesn't exist or soil_type is missing
        if (!data || data.length === 0 || !data[0].soil_type) {
          setIsProfileComplete(false)
        } else {
          setIsProfileComplete(true)
        }
        setProfileLoading(false)
      }
      checkProfile()
    }
  }, [session])

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FAF7F2]">
      <div className="animate-pulse font-serif italic text-[#2D6A4F] text-3xl tracking-tighter">CropPulse...</div>
    </div>
  )

  return (
    <AppContext.Provider value={{ isDevMode, session, isProfileComplete, setIsProfileComplete }}>
      <LanguageProvider session={session}>
        <MQTTProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/onboarding" element={session ? <Onboarding /> : <Navigate to="/login" />} />

            {/* Root Route: Landing Page (Public) */}
            <Route path="/" element={<LandingPage />} />

            {/* Dashboard Route: Existing app with auth guard */}
            <Route path="/dashboard" element={session ? (
              !isProfileComplete ? <Navigate to="/onboarding" /> : (
              <Layout>
                <Dashboard />
              </Layout>
              )
            ) : <Navigate to="/login" />} />
            
            <Route path="/recommendations" element={session ? <Layout><Recommendations /></Layout> : <Navigate to="/login" />} />
            <Route path="/alerts" element={session ? <Layout><Alerts /></Layout> : <Navigate to="/login" />} />
            <Route path="/reports" element={session ? <Layout><Reports /></Layout> : <Navigate to="/login" />} />
            <Route path="/archive" element={session ? <Layout><ArchivePage /></Layout> : <Navigate to="/login" />} />
            <Route path="/settings" element={session ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
            
            {/* Dev Mode Routes */}
            <Route path="/simulation" element={session && isDevMode ? <Layout><Simulation /></Layout> : <Navigate to="/" />} />
            <Route path="/insights" element={session && isDevMode ? <Layout><SoilInsights /></Layout> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        {isDevMode && <DevStatusBar />}
        </MQTTProvider>
      </LanguageProvider>
    </AppContext.Provider>
  )
}

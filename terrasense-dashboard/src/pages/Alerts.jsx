import { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { formatDistanceToNow } from 'date-fns'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'
import { hi, kn } from 'date-fns/locale'

// UI Components
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const AlertCard = ({ alert, onResolve }) => {
  const { t, language } = useLanguage()
  const [resolving, setResolving] = useState(false)

  const handleResolve = async () => {
    setResolving(true)
    await onResolve(alert.id)
    setResolving(false)
  }

  const variant = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'default'

  return (
    <Card 
      className={`animate-ready rounded-[2rem] border-none shadow-xl shadow-black/[0.02] p-8 ${
        alert.resolved ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex gap-6 items-center">
          <div className={`p-5 rounded-2xl shadow-inner ${
            alert.severity === 'critical' ? 'bg-semantic-danger/10 text-semantic-danger' : 
            alert.severity === 'warning' ? 'bg-semantic-warning/10 text-semantic-warning' : 'bg-semantic-info/10 text-semantic-info'
          }`}>
            {alert.severity === 'critical' ? <AlertTriangle size={28} strokeWidth={1.5} /> : 
             alert.severity === 'warning' ? <Bell size={28} strokeWidth={1.5} /> : <Info size={28} strokeWidth={1.5} />}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge variant={alert.severity} className="rounded-lg text-[9px] font-black uppercase tracking-widest border-none shadow-sm">{alert.severity}</Badge>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock size={12} className="opacity-40" />
                {formatDistanceToNow(new Date(alert.triggered_at), { locale: language === 'KN' ? kn : language === 'HI' ? hi : undefined })} {t('ago')}
              </span>
            </div>
            <h4 className="text-xl font-black text-brand-dark tracking-tighter">{alert.message}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Node #12 • {new Date(alert.triggered_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {!alert.resolved && (
          <button 
            onClick={handleResolve}
            disabled={resolving}
            className="shrink-0 bg-brand-bg hover:bg-brand-green hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 border border-black/[0.03]"
          >
            {resolving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {t('mark_resolved')}
          </button>
        )}
      </div>
    </Card>
  )
}

export default function Alerts() {
  const { session } = useApp()
  const { t } = useLanguage()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('triggered_at', { ascending: false })
      if (data) setAlerts(data)
    } catch (e) {
      console.warn("Alerts fetch failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) fetchAlerts()
  }, [session])

  const handleResolve = async (alertId) => {
    const { error } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId)

    if (!error) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a))
    }
  }

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unresolved') return !a.resolved
    if (filter === 'resolved') return a.resolved
    return true
  })

  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-8">
      <Loader2 className="animate-spin text-brand-green" size={64} strokeWidth={1} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">{t('scanning_fleet')}</p>
    </div>
  )

  return (
    <main className="p-8 space-y-10 max-w-[1200px] mx-auto w-full animate-ready relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[url('/dashboard_nature_pattern.png')] bg-contain bg-no-repeat opacity-[0.02] pointer-events-none -z-10 animate-gentleFloat" />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mb-3 block">{t('alert_system')}</span>
           <div className="flex items-center gap-4 mb-2">
             <h1 className="text-3xl md:text-4xl font-black text-brand-dark tracking-tighter">{t('alerts_console')}</h1>
             {criticalCount > 0 && (
               <div className="bg-semantic-danger text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse shadow-xl shadow-semantic-danger/20">
                 {criticalCount} {t('critical_alerts')}
               </div>
             )}
           </div>
           <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">{t('soil_health_notif')}</p>
        </div>

        <div className="flex items-center p-1.5 bg-brand-bg rounded-[2rem] border border-black/[0.03]">
          {['all', 'unresolved', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-white shadow-xl shadow-black/[0.02] text-brand-dark' : 'text-gray-400 hover:text-brand-green'
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <Card className="py-24 flex flex-col items-center text-center gap-8 rounded-[3rem] border-dashed border-2 border-brand-green/10 bg-transparent">
          <div className="w-20 h-20 bg-brand-green-surface text-brand-green rounded-3xl flex items-center justify-center shadow-inner">
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-brand-dark tracking-tighter">{t('fleet_normal')}</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed font-medium">
              {t('grove_optimal')}
            </p>
          </div>
          <button 
            onClick={fetchAlerts} 
            className="flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest hover:underline"
          >
            <RefreshCw size={14} /> {t('refresh_scan')}
          </button>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </main>
  )
}

import { useState, useEffect } from 'react'
import { Sprout, Droplets, Mountain, Gauge, Pencil, AlertCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'

// UI Components
import Card from './ui/Card'
import Button from './ui/Button'

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-5 bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-[#D8F3DC]/30 group hover:border-[#2D6A4F] transition-all duration-500">
    <div className="w-12 h-12 bg-[#F5F9F5] rounded-2xl flex items-center justify-center text-[#2D6A4F] group-hover:rotate-6 transition-all duration-500">
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-1">{label}</span>
      <span className="text-sm font-black text-[#1B4332] leading-tight">{value || t('not_set')}</span>
    </div>
  </div>
)

export default function FarmProfileCard() {
  const { session } = useApp()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      } catch (e) {
        console.warn("Profile fetch failed")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [session])

  if (loading) return (
    <Card className="flex items-center justify-center animate-pulse min-h-[100px]">
      <Loader2 className="animate-spin text-brand-green" size={24} />
    </Card>
  )

  const isComplete = profile?.soil_type && profile?.crop_type

  return (
    <div className="w-full">
      {!isComplete ? (
        <Card variant="warning" className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white p-4 rounded-xl shadow-sm text-semantic-warning border border-semantic-warning/10">
              <AlertCircle size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-900 leading-none mb-1">{t('complete_profile')}</h4>
              <p className="text-sm font-medium text-gray-500">{t('setup_profile_desc')}</p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="primary" size="lg">
              {t('setup_now')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoItem icon={Sprout} label={t('crop_type')} value={t(profile.crop_type)} />
            <InfoItem icon={Gauge} label={t('growth_stage')} value={t(profile.growth_stage)} />
            <InfoItem icon={Mountain} label={t('soil_type')} value={t(profile.soil_type)} />
            <InfoItem icon={Droplets} label={t('irrigation')} value={t(profile.irrigation_method)} />
          </div>
          
          <Link to="/settings">
            <Button variant="secondary" className="p-4" title="Edit Profile">
              <Pencil size={20} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

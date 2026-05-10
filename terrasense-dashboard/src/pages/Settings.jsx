import { useState, useEffect } from 'react'
import { Settings2, Save, Globe, Loader2, CheckCircle2, AlertCircle, User, MapPin, Sprout, Droplets, Mountain, Gauge, Phone, MessageSquare, Database } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'

const InputGroup = ({ label, children }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">{label}</label>
    {children}
  </div>
)

export default function Settings() {
  const { session } = useApp()
  const { t, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [formData, setFormData] = useState({
    farm_name: '', region: '', soil_type: '', 
    crop_type: '', growth_stage: '', irrigation_method: '',
    language_preference: 'EN',
    phone_number: '', sms_notifications_enabled: false
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setFormData(data)
      } catch (e) {
        console.warn("Profile fetch failed")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [session])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, ...formData, updated_at: new Date() })
    if (!error) {
      setLanguage(formData.language_preference)
      setStatus('success')
    } else {
      setStatus('error')
    }
    setSaving(false)
    setTimeout(() => setStatus(null), 3000)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-10">
      <div className="relative">
        <div className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-[#D8F3DC] animate-spin duration-[3000ms]" />
        <Settings2 className="absolute inset-0 m-auto text-[#2D6A4F] animate-pulse" size={32} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">{t('loading_prefs')}</p>
    </div>
  )

  const inputClasses = "w-full bg-[#FAF7F2] border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm text-[#1B4332] font-black placeholder:text-gray-300 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md";

  return (
    <main className="p-8 md:p-12 space-y-12 max-w-[1400px] mx-auto w-full animate-ready relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[url('/dashboard_nature_pattern.png')] bg-contain bg-no-repeat opacity-[0.02] pointer-events-none -z-10 animate-gentleFloat" />
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-[#2D6A4F]">
                 <Settings2 size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#2D6A4F]">{t('configuration')}</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-[#1B4332] tracking-tighter mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>{t('farm_settings')}</h1>
           <p className="text-[11px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-gray-200"></span>
              {t('ai_personalization')}
           </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-4 bg-[#1B4332] text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all duration-500"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {t('save_all_changes')}
        </button>
      </div>

      {status === 'success' && (
        <div className="bg-[#F5F9F5] border border-[#D8F3DC] p-6 rounded-[2rem] flex items-center gap-4 animate-ready">
          <div className="w-10 h-10 bg-[#52B788] rounded-xl flex items-center justify-center text-white">
            <CheckCircle2 size={20} />
          </div>
          <span className="text-sm font-black text-[#1B4332] uppercase tracking-widest">{t('profile_updated')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Sidebar: Profile Summary */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] flex flex-col items-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-[#2D6A4F] group-hover:rotate-12 transition-transform duration-1000">
                <Sprout size={150} />
             </div>
             
             <div className="w-24 h-24 bg-[#1B4332] text-white rounded-[2.5rem] flex items-center justify-center text-3xl font-black mb-8 shadow-2xl shadow-emerald-900/20 relative z-10">
               {formData.farm_name?.[0] || 'T'}
             </div>
             
             <h3 className="text-2xl font-black text-[#1B4332] tracking-tighter mb-2 relative z-10" style={{ fontFamily: '"Playfair Display", serif' }}>
               {formData.farm_name || t('my_farm')}
             </h3>
             
             <div className="px-6 py-2 bg-[#FAF7F2] text-[#2D6A4F] rounded-full text-[10px] font-black uppercase tracking-widest mb-10 border border-[#D8F3DC]">
                {formData.region || t('region_not_set')}
             </div>
             
             <div className="w-full h-px bg-[#FAF7F2] mb-10" />
             
             <div className="space-y-6 w-full relative z-10">
                <div className="flex justify-between items-center group/item">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">{t('identity_tag')}</span>
                  <span className="text-[10px] font-black text-[#1B4332]">...{session.user.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between items-center group/item overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">{t('system_access')}</span>
                  <span className="text-[10px] font-black text-[#1B4332] truncate ml-8">{session.user.email}</span>
                </div>
             </div>
          </div>

          <div className="bg-[#B45F43] p-10 rounded-[3rem] shadow-2xl shadow-orange-900/20 text-white space-y-6 relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 opacity-10">
                <Mountain size={200} />
             </div>
             <h4 className="text-xl font-black tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>{t('resource_linkage')}</h4>
             <p className="text-xs text-white/60 font-medium leading-relaxed">
               {t('precise_analysis_desc')}
             </p>
          </div>
        </div>

        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] space-y-12">
            <div className="flex items-center gap-4 text-[#1B4332] mb-4">
              <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#2D6A4F]">
                 <Database size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#2D6A4F]">{t('farm_architecture')}</h4>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{t('core_telemetry_defs')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label={t('enterprise_name')}>
                <input value={formData.farm_name || ''} onChange={e => setFormData({...formData, farm_name: e.target.value})} className={inputClasses} placeholder="e.g. CropPulse Valley" />
              </InputGroup>
              <InputGroup label={t('geographic_region')}>
                <input value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} className={inputClasses} placeholder="e.g. Karnataka" />
              </InputGroup>
              <InputGroup label={t('soil_classification')}>
                <select value={formData.soil_type || ''} onChange={e => setFormData({...formData, soil_type: e.target.value})} className={inputClasses}>
                  <option value="">{t('select_soil_profile')}...</option>
                  {['Sandy', 'Clayey', 'Red', 'Black', 'Loamy'].map(s => <option key={s} value={s}>{t(s.toLowerCase())}</option>)}
                </select>
              </InputGroup>
              <InputGroup label={t('cultivar_selection')}>
                <select value={formData.crop_type || ''} onChange={e => setFormData({...formData, crop_type: e.target.value})} className={inputClasses}>
                  <option value="">{t('select_variety')}...</option>
                  {['Tomato', 'Lettuce', 'Basil', 'Cucumber', 'Pepper', 'Strawberry', 'Spinach'].map(c => <option key={c} value={c}>{t(c.toLowerCase())}</option>)}
                </select>
              </InputGroup>
              <InputGroup label={t('lifecycle_phase')}>
                <select value={formData.growth_stage || ''} onChange={e => setFormData({...formData, growth_stage: e.target.value})} className={inputClasses}>
                  <option value="">{t('select_current_phase')}...</option>
                  {['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready'].map(g => <option key={g} value={g}>{t(g.toLowerCase().replace(' ', '_'))}</option>)}
                </select>
              </InputGroup>
              <InputGroup label={t('hydration_protocol')}>
                <select value={formData.irrigation_method || 'Manual'} onChange={e => setFormData({...formData, irrigation_method: e.target.value})} className={inputClasses}>
                  <option value="Drip">{t('drip')}</option>
                  <option value="Sprinkler">{t('sprinkler')}</option>
                  <option value="Flood">{t('flood')}</option>
                  <option value="Manual">{t('manual')}</option>
                </select>
              </InputGroup>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] space-y-10">
            <div className="flex items-center gap-4 text-[#1B4332] mb-4">
               <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#2D6A4F]">
                  <MessageSquare size={20} />
               </div>
               <div>
                 <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#2D6A4F]">{t('emergency_comms')}</h4>
                 <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{t('sms_intelligence')}</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <InputGroup label={t('phone_number')}>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    value={formData.phone_number || ''} 
                    onChange={e => setFormData({...formData, phone_number: e.target.value})} 
                    className={`${inputClasses} pl-14`} 
                    placeholder="+1234567890" 
                  />
                </div>
              </InputGroup>
              <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-[1.5rem] border-2 border-transparent">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">{t('enable_sms_alerts')}</span>
                 <button 
                   onClick={() => setFormData({...formData, sms_notifications_enabled: !formData.sms_notifications_enabled})}
                   className={`w-14 h-8 rounded-full transition-all duration-500 relative ${formData.sms_notifications_enabled ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`}
                 >
                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-500 ${formData.sms_notifications_enabled ? 'left-7 shadow-lg shadow-emerald-900/20' : 'left-1'}`} />
                 </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] space-y-10">
            <div className="flex items-center gap-4 text-[#1B4332] mb-4">
              <div className="w-10 h-10 bg-[#EBF5FF] rounded-xl flex items-center justify-center text-[#4A90D9]">
                 <Globe size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#4A90D9]">{t('localization')}</h4>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{t('interface_prefs')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label={t('primary_language')}>
                <select value={formData.language_preference || 'EN'} onChange={e => setFormData({...formData, language_preference: e.target.value})} className={inputClasses}>
                  <option value="EN">English (Global)</option>
                  <option value="KN">ಕನ್ನಡ (Kannada)</option>
                  <option value="HI">हिंदी (Hindi)</option>
                  <option value="TE">తెలుగు (Telugu)</option>
                </select>
              </InputGroup>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

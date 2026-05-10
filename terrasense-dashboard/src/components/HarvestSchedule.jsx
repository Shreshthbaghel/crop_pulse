import { useState, useEffect } from 'react'
import { Calendar, Plus, Leaf, Clock, CheckCircle2, Loader2, X, Tag } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { format, differenceInDays, isPast } from 'date-fns'
import { useLanguage } from '../contexts/LanguageContext'

export default function HarvestSchedule() {
  const { session } = useApp()
  const { t } = useLanguage()
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ crop_name: '', harvest_date: '', notes: '' })

  const fetchHarvests = async () => {
    try {
      const { data } = await supabase.from('harvest_schedule').select('*').order('harvest_date', { ascending: true })
      if (data) setHarvests(data)
    } catch (e) {
      console.warn("Harvest table might not exist yet")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHarvests() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session?.user?.id) return
    const { error } = await supabase.from('harvest_schedule').insert([{ 
      crop_name: formData.crop_name,
      harvest_date: formData.harvest_date,
      notes: formData.notes,
      user_id: session.user.id
    }])
    if (!error) {
      setFormData({ crop_name: '', harvest_date: '', notes: '' })
      setShowForm(false)
      fetchHarvests()
    }
  }

  if (loading) return (
    <div className="bg-white rounded-[2.5rem] p-10 h-[400px] flex items-center justify-center animate-pulse border border-[#FAF7F2] shadow-xl shadow-emerald-900/5">
      <Loader2 className="animate-spin text-[#2D6A4F]" />
    </div>
  )

  const inputClasses = "w-full bg-[#FAF7F2] border-2 border-transparent rounded-2xl px-6 py-4 text-sm text-[#1B4332] font-black placeholder:text-gray-300 focus:outline-none focus:border-[#2D6A4F] focus:bg-white transition-all duration-300";

  return (
    <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/5 border border-[#FAF7F2] flex flex-col h-full min-h-[450px]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h4 className="text-xl font-black text-[#1B4332] tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>{t('harvest_calendar')}</h4>
          <p className="text-[10px] font-black text-[#52B788] uppercase tracking-[0.2em] mt-1">{t('lifecycle_tracking')}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${showForm ? 'bg-[#B45F43] text-white rotate-45' : 'bg-[#2D6A4F] text-white hover:scale-110 shadow-lg shadow-emerald-900/20'}`}
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex-1 relative">
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-ready">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('crop_name')}</label>
                 <input required placeholder="CropPulse Nano..." className={inputClasses} onChange={e => setFormData({...formData, crop_name: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('date')}</label>
                 <input required type="date" className={inputClasses} onChange={e => setFormData({...formData, harvest_date: e.target.value})} />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{t('notes')}</label>
              <textarea placeholder="Specific instructions for this cycle..." className={`${inputClasses} h-24 resize-none`} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-[#1B4332] text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-900/20">
               {t('save_to_pipeline')}
            </button>
          </form>
        ) : (
          <div className="h-full space-y-4">
            {harvests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-[#FAF7F2] rounded-[2rem] border-2 border-dashed border-[#D8F3DC]">
                <Calendar size={48} className="text-[#D8F3DC] mb-6" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('no_harvests')}</p>
                <p className="text-sm font-black text-[#1B4332] mt-2">{t('init_cycle')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {harvests.map((h) => {
                  const harvestDate = new Date(h.harvest_date)
                  const isCompleted = isPast(harvestDate)
                  const daysLeft = differenceInDays(harvestDate, new Date())
                  
                  return (
                    <div key={h.id} className={`group flex flex-col p-6 rounded-[2rem] border-2 transition-all duration-500 ${
                      isCompleted ? 'bg-[#FAF7F2] border-transparent opacity-60' : 'bg-white border-[#FAF7F2] hover:border-[#D8F3DC] hover:shadow-xl hover:shadow-emerald-900/5'
                    }`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-gray-200 text-gray-500' : 'bg-[#D8F3DC] text-[#2D6A4F] group-hover:rotate-6'}`}>
                          {isCompleted ? <CheckCircle2 size={22} /> : <Leaf size={22} />}
                        </div>
                        {!isCompleted && (
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={async () => {
                                 const { error } = await supabase.from('harvest_schedule').delete().eq('id', h.id)
                                 if (!error) fetchHarvests()
                               }}
                               className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                             >
                               <X size={16} />
                             </button>
                             <div className="px-4 py-1.5 bg-[#1B4332] text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                {daysLeft} {t('days')}
                             </div>
                           </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h5 className="text-lg font-black text-[#1B4332] mb-1 tracking-tight">{h.crop_name}</h5>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{format(harvestDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      {h.notes && (
                         <div className="mt-6 pt-4 border-t border-[#FAF7F2]">
                            <p className="text-[10px] text-gray-400 italic leading-relaxed line-clamp-2">"{h.notes}"</p>
                         </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

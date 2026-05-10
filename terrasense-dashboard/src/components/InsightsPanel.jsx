import { Calendar, CloudRain, MapPin, TrendingUp, MoreHorizontal } from 'lucide-react'

const HarvestItem = ({ icon: Icon, title, date, status }) => (
  <div className="flex items-center justify-between p-5 bg-white rounded-[28px] border border-gray-100 shadow-sm transition-all hover:border-primary-100">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-primary-600 shadow-sm">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 tracking-tight">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
           <Calendar size={12} className="text-gray-300" />
           <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">{date}</p>
        </div>
      </div>
    </div>
  </div>
)

export default function InsightsPanel() {
  return (
    <aside className="hidden xl:flex flex-col w-[340px] bg-transparent h-screen sticky top-0 p-8 space-y-10 overflow-y-auto">
      {/* Illustration Card */}
      <div className="relative h-64 rounded-[40px] overflow-hidden group shadow-sm border border-gray-50 bg-gray-50">
        <img 
          src="/cute_farm_illustration_1778331881213.png" 
          alt="Field Illustration" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
        />
        <div className="absolute bottom-8 left-8 right-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Field Insights</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold uppercase tracking-widest">
            <MapPin size={12} strokeWidth={3} />
            Maharashtra, India
          </div>
        </div>
      </div>

      {/* Harvest Schedule */}
      <div className="space-y-6 px-2">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Harvest Schedule</h3>
          <MoreHorizontal className="text-gray-300" size={24} />
        </div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest leading-relaxed">
          Manage collection & logistics.
        </p>
        <div className="space-y-4">
          <HarvestItem icon={CloudRain} title="Gandum Harvest" date="Jan 10, 2022" />
          <HarvestItem icon={TrendingUp} title="Soil Tilling" date="Jan 12, 2022" />
        </div>
      </div>

      {/* Rain Prediction Card */}
      <div className="p-10 bg-[#064e3b] rounded-[40px] shadow-2xl shadow-emerald-900/20 space-y-12 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Forecast</p>
            <h4 className="text-2xl font-bold text-white tracking-tight leading-none">Rain Prediction</h4>
          </div>
          <div className="w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md">
            <CloudRain size={24} strokeWidth={2.5} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 relative z-10">
          {[
            { label: 'Today', val: '12%' },
            { label: 'Tmrw', val: '68%' },
            { label: 'Wed', val: '40%' }
          ].map(d => (
            <div key={d.label} className="text-center">
              <p className="text-[10px] text-white/30 font-bold uppercase mb-2 tracking-wide">{d.label}</p>
              <p className="text-xl font-bold text-white tracking-tight">{d.val}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 pt-2">
          <button className="w-full py-5 bg-white text-[#064e3b] font-bold text-sm uppercase tracking-widest rounded-[24px] shadow-xl hover:bg-emerald-50 transition-all active:scale-95">
            View Report
          </button>
        </div>
      </div>

      {/* Version Meta */}
      <div className="mt-auto pt-8 flex items-center justify-center text-gray-200 border-t border-gray-50">
         <span className="text-[10px] font-bold tracking-[0.4em] uppercase">V2.4.0-STABLE</span>
      </div>
    </aside>
  )
}

const Leaf = ({ size }) => <div style={{width: size, height: size}} className="bg-current opacity-20 rounded-full" />

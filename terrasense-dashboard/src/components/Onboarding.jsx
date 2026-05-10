import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronRight, ChevronLeft, MapPin 
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useApp } from '../contexts/AppContext'
import { useLanguage } from '../contexts/LanguageContext'

const StepButton = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all duration-300 ${
      selected 
        ? 'bg-primary-600 text-white border-primary-600 shadow-lg scale-105' 
        : 'bg-white text-natural-text border-natural-border hover:border-primary-200'
    }`}
  >
    {label}
  </button>
)

export default function Onboarding() {
  const { session } = useApp()
  const { setLanguage } = useLanguage()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    farm_name: '', region: '', soil_type: '', 
    crop_type: '', growth_stage: '', irrigation_method: '',
    language_preference: 'EN'
  })

  const handleComplete = async () => {
    if (!session?.user?.id) return

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: session.user.id,
        ...data,
        updated_at: new Date()
      })

    if (!error) {
      setLanguage(data.language_preference)
      navigate('/')
    } else {
      console.error("Onboarding failed:", error)
    }
  }

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-natural-border overflow-hidden flex flex-col">
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-natural-bg flex">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`flex-1 transition-all duration-500 ${step >= i ? 'bg-primary-600' : 'opacity-0'}`} />
          ))}
        </div>

        <div className="p-10 flex-1 min-h-[400px]">
          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mb-6">
                <MapPin size={32} />
              </div>
              <h2 className="text-3xl font-serif italic text-primary-700 mb-2">Welcome to CropPulse</h2>
              <p className="text-sm opacity-50 mb-8">Let's start with your farm's location and name.</p>
              <div className="space-y-4">
                <input 
                  placeholder="Farm Name (e.g. Green Valley)" 
                  className="w-full p-4 rounded-2xl border border-natural-border outline-none focus:ring-2 focus:ring-primary-500"
                  value={data.farm_name}
                  onChange={e => setData({...data, farm_name: e.target.value})}
                />
                <input 
                  placeholder="Region (e.g. Karnataka)" 
                  className="w-full p-4 rounded-2xl border border-natural-border outline-none focus:ring-2 focus:ring-primary-500"
                  value={data.region}
                  onChange={e => setData({...data, region: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Step 2: Soil */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold mb-6">What is your soil type?</h2>
              <div className="grid grid-cols-2 gap-4">
                {['Sandy', 'Clayey', 'Red', 'Black', 'Loamy'].map(s => (
                  <StepButton key={s} label={s} selected={data.soil_type === s} onClick={() => setData({...data, soil_type: s})} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Crop */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold mb-6">What are you growing?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Tomato', 'Lettuce', 'Basil', 'Cucumber', 'Pepper', 'Strawberry', 'Spinach'].map(c => (
                  <StepButton key={c} label={c} selected={data.crop_type === c} onClick={() => setData({...data, crop_type: c})} />
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Growth */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold mb-6">Current growth stage?</h2>
              <div className="grid grid-cols-1 gap-3">
                {['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready'].map(g => (
                  <StepButton key={g} label={g} selected={data.growth_stage === g} onClick={() => setData({...data, growth_stage: g})} />
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Irrigation & Lang */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold mb-4">Final details</h2>
              <p className="text-[10px] font-bold opacity-30 uppercase mb-3">Irrigation Method</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {['Drip', 'Sprinkler', 'Flood', 'Manual'].map(i => (
                  <StepButton key={i} label={i} selected={data.irrigation_method === i} onClick={() => setData({...data, irrigation_method: i})} />
                ))}
              </div>
              <p className="text-[10px] font-bold opacity-30 uppercase mb-3">Preferred Language</p>
              <div className="grid grid-cols-4 gap-2">
                {['EN', 'KN', 'HI', 'TE'].map(l => (
                  <StepButton key={l} label={l} selected={data.language_preference === l} onClick={() => setData({...data, language_preference: l})} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="p-8 bg-natural-bg flex justify-between items-center">
          {step > 1 ? (
            <button onClick={back} className="flex items-center gap-2 font-bold text-primary-700 opacity-60 hover:opacity-100 transition-opacity">
              <ChevronLeft size={20} /> Back
            </button>
          ) : <div />}

          <button 
            onClick={step === 5 ? handleComplete : next}
            disabled={(step === 2 && !data.soil_type) || (step === 3 && !data.crop_type) || (step === 1 && !data.farm_name)}
            className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl disabled:opacity-30 transition-all hover:bg-primary-700 active:scale-95"
          >
            {step === 5 ? 'Complete Setup' : 'Next'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

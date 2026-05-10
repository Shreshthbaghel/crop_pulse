import { Check, Sprout } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export default function CropGrowthTimeline({ growthStage = 'Germination', cropType = 'Crop' }) {
  const stages = [
    "Germination", 
    "Vegetative", 
    "Flowering", 
    "Fruiting", 
    "Harvest Ready"
  ]

  const currentIdx = stages.indexOf(growthStage) !== -1 ? stages.indexOf(growthStage) : 0

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Crop Growth Activity</h3>
          <p className="text-sm font-bold text-gray-900 mt-1.5">{cropType} Monitoring</p>
        </div>
        <Badge variant="info">Weekly Assessment</Badge>
      </div>

      <div className="relative">
        <div className="absolute top-6 left-6 right-6 h-[2px] border-t-2 border-dashed border-gray-100 z-0" />
        
        <div className="relative z-10 flex justify-between items-start">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIdx
            const isActive = idx === currentIdx

            return (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' :
                    isActive ? 'bg-white border-4 border-brand-orange text-brand-orange shadow-button' :
                    'bg-gray-50 text-gray-300 border border-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={20} strokeWidth={3} />
                  ) : isActive ? (
                    <Sprout size={24} className="animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  )}
                </div>

                <div className="mt-4 text-center px-1">
                  <p className={`text-[10px] font-bold uppercase tracking-tight ${
                    isCompleted ? 'text-brand-green' :
                    isActive ? 'text-brand-orange font-black' :
                    'text-gray-400'
                  }`}>
                    {stage}
                  </p>
                  <p className="text-[10px] font-semibold text-gray-400 mt-1">Week {idx + 1}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />
        <p className="text-xs text-gray-500">
          Optimal phase for <span className="text-gray-900 font-bold">{growthStage}</span> tracking.
        </p>
      </div>
    </Card>
  )
}

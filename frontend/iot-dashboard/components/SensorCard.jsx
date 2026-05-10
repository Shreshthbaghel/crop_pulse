export default function SensorCard({ title, value, unit, icon, color, threshold }) {
  const isWarning = value < threshold[0] || value > threshold[1];
  
  const colors = {
    emerald: 'border-emerald-500/20 text-emerald-400',
    amber: 'border-amber-500/20 text-amber-400',
    cyan: 'border-cyan-500/20 text-cyan-400',
  };

  return (
    <div className={`bg-white/5 border ${colors[color]} rounded-3xl p-6 transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
        {isWarning && (
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md font-bold uppercase">Alert</span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-mono tracking-tighter">{value}</span>
          <span className="text-gray-500 text-sm font-medium">{unit}</span>
        </div>
      </div>
    </div>
  );
}

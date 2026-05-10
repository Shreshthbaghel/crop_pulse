import { format } from 'date-fns';

export default function HistoryTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-gray-400 uppercase text-[10px] font-bold tracking-widest">
          <tr>
            <th className="px-6 py-4">Timestamp</th>
            <th className="px-6 py-4 text-emerald-400">Moisture (%)</th>
            <th className="px-6 py-4 text-amber-400">EC (mS/cm)</th>
            <th className="px-6 py-4 text-cyan-400">TDS (ppm)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {[...data].reverse().map((r, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 text-gray-500 font-mono">
                {r.created_at ? format(new Date(r.created_at), 'HH:mm:ss | MMM dd') : '—'}
              </td>
              <td className="px-6 py-4 font-semibold">{r.moisture}</td>
              <td className="px-6 py-4 font-semibold">{r.ec?.toFixed(4)}</td>
              <td className="px-6 py-4 font-semibold">{r.tds?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

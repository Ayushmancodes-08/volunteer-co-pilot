import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useI18n } from '../context/I18nContext.jsx';
import GateCard from './GateCard.jsx';

export default function CrowdDashboard({ gates, evaluating }) {
  const { t } = useI18n();

  // Prepare data for the history trend chart (last 8 data points)
  const chartData = Array.from({ length: 8 }).map((_, idx) => {
    const dataPoint = { name: `T-${8 - idx - 1}m` };
    gates.forEach((gate) => {
      const historyVals = gate.history || [gate.occupancy];
      // Pad or slice to map onto the 8 points
      const val = historyVals[idx] !== undefined 
        ? historyVals[idx] 
        : gate.occupancy;
      dataPoint[gate.gate] = val;
    });
    return dataPoint;
  });

  const lineColors = {
    A: '#3b82f6', // blue
    B: '#10b981', // emerald
    C: '#f59e0b', // amber
    D: '#8b5cf6', // violet
    E: '#ec4899', // pink
    F: '#64748b'  // slate
  };

  return (
    <section className="space-y-6" aria-label={t('crowd.title')}>
      {/* Title & Refresh Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('crowd.title')}</h2>
          <p className="text-sm text-slate-500">Real-time gate ingress sensor readings updating every 5s.</p>
        </div>
        {evaluating && (
          <span className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50">
            <svg className="animate-spin h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('crowd.refreshing')}
          </span>
        )}
      </div>

      {/* Main Grid: Heatmap + GateCards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Trend Analytics (Recharts Line Chart) */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Occupancy Profiles (T-8 to Present)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                {Object.keys(lineColors).map((g) => (
                  <Line 
                    key={g} 
                    type="monotone" 
                    dataKey={g} 
                    name={`Gate ${g}`} 
                    stroke={lineColors[g]} 
                    strokeWidth={2.5} 
                    dot={{ r: 3 }} 
                    activeDot={{ r: 5 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Gate Status Overview */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Operational Summary</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Real-time monitoring is active across all gates. Red zones require immediate supervisor alerts and multilingual redirection scripts.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2">
              <span>Gate Class</span>
              <span>Count</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>OK (&lt;60%)</span>
              <span className="font-bold text-slate-700">{gates.filter(g => g.occupancy < 60).length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>WARNING (60-79%)</span>
              <span className="font-bold text-slate-700">{gates.filter(g => g.occupancy >= 60 && g.occupancy < 80).length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>CRITICAL (&ge;80%)</span>
              <span className="font-bold text-slate-700">{gates.filter(g => g.occupancy >= 80).length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid of Gate status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {gates.map((gate) => (
          <GateCard 
            key={gate.gate} 
            gate={gate.gate} 
            occupancy={gate.occupancy} 
            history={gate.history} 
          />
        ))}
      </div>
    </section>
  );
}
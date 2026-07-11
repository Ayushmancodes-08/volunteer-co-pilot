'use client';
import { memo } from 'react';
import { useI18n } from '../context/I18nContext.jsx';

function GateCard({ gate, occupancy, history = [] }) {
  const { t } = useI18n();
  let status;
  let bgClass;
  let badgeClass;
  let icon;
  let strokeColor;

  if (occupancy >= 80) {
    status = t('crowd.status.red');
    bgClass = 'bg-red-50/80 backdrop-blur-sm border-red-500/40 shadow-red-100/50';
    badgeClass = 'bg-red-600 text-white';
    strokeColor = '#dc2626';
    icon = (
      <svg className="w-5 h-5 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (occupancy >= 60) {
    status = t('crowd.status.yellow');
    bgClass = 'bg-yellow-50/80 backdrop-blur-sm border-yellow-500/40 shadow-yellow-100/50';
    badgeClass = 'bg-yellow-600 text-white';
    strokeColor = '#ca8a04';
    icon = (
      <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else {
    status = t('crowd.status.green');
    bgClass = 'bg-slate-50/80 backdrop-blur-sm border-slate-200/60 shadow-slate-100/50';
    badgeClass = 'bg-emerald-600 text-white';
    strokeColor = '#10b981';
    icon = (
      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  const sparklinePath = history && history.length > 1
    ? (() => {
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min === 0 ? 1 : max - min;
        const points = history.map((val, idx) => {
          const x = (idx / (history.length - 1)) * 60;
          const y = 16 - ((val - min) / range) * 12 - 2;
          return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
      })()
    : '';

  return (
    <article
      className={`border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] ${bgClass}`}
      role="region"
      aria-label={`Gate ${gate}: ${occupancy}% occupied, status ${status}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800">Gate {gate}</h3>
        {icon}
      </div>

      <div className="flex items-end justify-between mb-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight" aria-hidden="true">
          {occupancy}%
        </div>
        {sparklinePath && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend (8m)</span>
            <svg className="w-16 h-4" viewBox="0 0 60 16" fill="none" aria-hidden="true">
              <path d={sparklinePath} stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`} role="status">
          {status}
        </span>
        <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden" role="progressbar" aria-valuenow={occupancy} aria-valuemin={0} aria-valuemax={100} aria-label={`Gate ${gate} occupancy ${occupancy}%`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancy >= 80 ? 'bg-red-600' : occupancy >= 60 ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancy}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export default memo(GateCard);
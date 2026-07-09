'use client';
import { useI18n } from '../context/I18nContext.jsx';

export default function AlertsPanel({ alerts, onDismiss }) {
  const { t } = useI18n();

  // Sort alerts: higher occupancy gets higher priority
  const sortedAlerts = [...alerts].sort((a, b) => b.occupancy - a.occupancy);

  return (
    <section className="space-y-4" aria-label={t('alerts.panel')} aria-live="polite">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-slate-800">{t('alerts.panel')}</h2>
        {alerts.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
            {alerts.length}
          </span>
        )}
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
          <span className="text-2xl block mb-1">🎉</span>
          <p className="text-sm font-medium text-slate-400">{t('alerts.noAlerts')}</p>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {sortedAlerts.map((alert) => (
            <li
              key={alert.id}
              className="bg-white border-l-4 border-red-500 border-t border-r border-b border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-slideIn flex flex-col md:flex-row justify-between md:items-start gap-4"
              role="alert"
            >
              {/* Left Column: Occupancy telemetry & Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                    {t('crowd.status.red')}
                  </span>
                  <span className="font-extrabold text-slate-800">Gate {alert.gate}</span>
                  <span className="text-sm font-medium text-slate-400">capacity exceeded</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Action recommendation */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('alerts.action')}</span>
                    <p className="text-sm font-semibold text-slate-700 leading-normal">{alert.action}</p>
                  </div>
                  {/* AI justification reasoning */}
                  <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/30">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">{t('alerts.reasoning')}</span>
                    <p className="text-sm text-slate-600 leading-normal font-medium">{alert.reasoning}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions (Telemetry indicator, dismiss trigger) */}
              <div className="flex items-center md:flex-col justify-between md:justify-start gap-4 md:items-end self-center md:self-start">
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-red-600 tracking-tight">{alert.occupancy}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ingress load</span>
                </div>
                
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 p-2.5 rounded-xl border border-slate-200 transition-all text-xs font-semibold flex items-center gap-1"
                  aria-label={`${t('alerts.dismiss')} alert for Gate ${alert.gate}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Resolve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
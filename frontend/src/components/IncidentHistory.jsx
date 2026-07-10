'use client';
import { useI18n } from '../context/I18nContext.jsx';

export default function IncidentHistory({ history }) {
  const { t } = useI18n();

  return (
    <section aria-label={t('history.title')}>
      <h2 className="text-xl font-semibold mb-4">{t('history.title')}</h2>
      {history.length === 0 ? (
        <p className="text-slate-500 text-center py-8">{t('history.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <caption className="sr-only">
              {t('history.title')} — {history.length} incident{history.length !== 1 ? 's' : ''} recorded
            </caption>
            <thead>
              <tr className="bg-slate-100">
                <th scope="col" className="text-left px-4 py-2 font-medium text-slate-600">{t('history.time')}</th>
                <th scope="col" className="text-left px-4 py-2 font-medium text-slate-600">{t('history.gate')}</th>
                <th scope="col" className="text-left px-4 py-2 font-medium text-slate-600">{t('history.action')}</th>
                <th scope="col" className="text-left px-4 py-2 font-medium text-slate-600">{t('alerts.reasoning')}</th>
                <th scope="col" className="text-left px-4 py-2 font-medium text-slate-600">{t('history.status')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 font-medium">Gate {entry.gate}</td>
                  <td className="px-4 py-2">{entry.action}</td>
                  <td className="px-4 py-2 text-slate-600">{entry.reasoning}</td>
                  <td className="px-4 py-2">
                    {entry.dismissed ? (
                      <span className="text-green-600 font-medium">{t('history.resolved')}</span>
                    ) : (
                      <span className="text-red-600 font-medium">{t('history.active')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
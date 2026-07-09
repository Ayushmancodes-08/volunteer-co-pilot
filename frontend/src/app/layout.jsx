import { I18nProvider } from '../context/I18nContext.jsx';
import './globals.css';

export const metadata = {
  title: 'Volunteer Co-Pilot - FIFA World Cup 2026',
  description:
    'GenAI-powered crowd management and multilingual assistance dashboard for stadium volunteers during FIFA World Cup 2026.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
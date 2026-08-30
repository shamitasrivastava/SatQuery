import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SatQuery | AI Geospatial Intelligence & RS-VQA',
  description: 'AI-Powered Geospatial Intelligence, RS-VQA & Bi-temporal Change Detection Dashboard for SIH',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-tactical-950 text-slate-200 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
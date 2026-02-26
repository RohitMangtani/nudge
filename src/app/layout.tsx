import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nudge — Life maintenance on autopilot',
  description: 'Never forget the things that matter. Nudge reminds you about life\'s maintenance — health, car, home, finances — so you don\'t have to remember.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#020202" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

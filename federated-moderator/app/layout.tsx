import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FediNet — Moderator Console',
  description: 'Content moderation dashboard for FediNet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

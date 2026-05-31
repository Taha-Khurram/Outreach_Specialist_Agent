import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClientFlow - AI-Powered Client Acquisition',
  description: 'Automate your outbound sales with AI. Find prospects, send personalized emails, and close deals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 antialiased">{children}</body>
    </html>
  );
}

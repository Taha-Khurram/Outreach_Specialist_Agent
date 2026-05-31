import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ClientFlow - AI-Powered Client Acquisition',
  description: 'Automate your outbound sales with AI. Find prospects, send personalized emails, and close deals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className={`h-full ${inter.className}`}>{children}</body>
    </html>
  );
}

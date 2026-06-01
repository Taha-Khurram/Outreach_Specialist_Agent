import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure API keys, email settings, targeting, and scheduling.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

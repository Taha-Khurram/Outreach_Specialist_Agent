import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pipeline',
  description: 'Track deals and manage your sales pipeline.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

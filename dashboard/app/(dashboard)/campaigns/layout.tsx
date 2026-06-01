import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Create and manage automated email outreach campaigns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

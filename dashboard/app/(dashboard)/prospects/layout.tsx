import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prospects',
  description: 'Manage and discover potential clients for outreach campaigns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

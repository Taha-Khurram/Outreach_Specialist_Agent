import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Create and manage email templates for outreach campaigns.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

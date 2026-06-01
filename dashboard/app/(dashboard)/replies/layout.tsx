import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Replies',
  description: 'Monitor and respond to prospect email replies.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

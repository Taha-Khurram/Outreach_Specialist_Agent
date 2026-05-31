'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Mail, MessageSquare, LogOut, Zap, TrendingUp, Kanban,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Replies', href: '/replies', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-gradient-to-b from-[#012a4a] via-[#013a63] to-[#01497c]">
      {/* Logo - exactly 64px to match header */}
      <div className="flex items-center gap-3 px-6 h-16 shrink-0 border-b border-white/8">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#61a5c2] to-[#2a6f97] flex items-center justify-center shadow-md">
          <Zap className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">ClientFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-active' : 'sidebar-nav-inactive'}`}
            >
              <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[#89c2d9]' : 'text-[#89c2d9]/50'}`} />
              <span>{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#89c2d9]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/8 p-3 space-y-2">
        <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs font-medium text-white/80">Agent Active</span>
          </div>
          <p className="mt-1 text-[11px] text-white/40 pl-4">Next check in 3 min</p>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item sidebar-nav-inactive w-full"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

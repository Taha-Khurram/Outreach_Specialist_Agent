'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, Settings, ChevronDown, X, CheckCircle, Mail, MessageSquare, DollarSign } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  company: string;
}

interface Notification {
  id: string;
  type: 'reply' | 'meeting' | 'campaign' | 'system' | 'deal';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAllRead() {
    setReadIds(new Set(notifications.map(n => n.id)));
  }

  function markRead(id: string) {
    setReadIds(prev => new Set(prev).add(id));
  }

  function getNotifIcon(type: string) {
    switch (type) {
      case 'reply': return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'meeting': return <CheckCircle className="h-4 w-4 text-brand-600" />;
      case 'campaign': return <Mail className="h-4 w-4 text-brand-700" />;
      case 'deal': return <DollarSign className="h-4 w-4 text-amber-600" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  }

  const initials = user ? getInitials(user.name) : '??';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80">
      <div className="flex items-center justify-between h-16 px-6">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-56 pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-50 border transition-all duration-200 placeholder:text-gray-400 ${
                searchFocused ? 'border-brand-400 ring-2 ring-brand-100 w-72 bg-white' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded text-gray-400 hover:text-gray-600" aria-label="Close notifications">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                      <p className="text-xs text-gray-400 mt-1">Activity will appear here as you use the platform</p>
                    </div>
                  ) : (
                    notifications.map(n => {
                      const isRead = readIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!isRead ? 'bg-brand-50/30' : ''}`}
                        >
                          <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!isRead ? 'bg-brand-100' : 'bg-gray-100'}`}>
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm truncate ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              {!isRead && <div className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{n.description}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{formatTimeAgo(n.time)}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
              aria-expanded={showProfile}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#468faf] to-[#014f86] flex items-center justify-center">
                <span className="text-xs font-semibold text-white">{initials}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email || ''}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { router.push('/settings'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => { router.push('/profile'); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

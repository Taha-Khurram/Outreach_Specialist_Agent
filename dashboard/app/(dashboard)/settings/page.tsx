'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Save, Key, Mail, Globe, Bot, Bell, Loader2 } from 'lucide-react';

interface SettingsState {
  apiKeys: {
    apolloApiKey: string;
    geminiApiKey: string;
    googleRefreshToken: string;
  };
  email: {
    senderEmail: string;
    senderName: string;
    dailySendLimit: number;
    calendlyLink: string;
  };
  ai: {
    model: string;
    confidenceThreshold: number;
    autoReplyPositive: boolean;
    autoUnsubscribe: boolean;
  };
  targeting: {
    titles: string[];
    industries: string[];
    companySize: string;
    location: string;
  };
  schedule: {
    discoveryTime: string;
    emailSendTime: string;
    replyCheckInterval: number;
    reportTime: string;
  };
}

const defaultSettings: SettingsState = {
  apiKeys: { apolloApiKey: '', geminiApiKey: '', googleRefreshToken: '' },
  email: { senderEmail: '', senderName: '', dailySendLimit: 50, calendlyLink: '' },
  ai: { model: 'gemini-3-flash-preview', confidenceThreshold: 0.8, autoReplyPositive: true, autoUnsubscribe: true },
  targeting: { titles: ['CEO', 'CTO', 'VP Engineering', 'Founder'], industries: ['SaaS', 'E-commerce', 'FinTech', 'HealthTech'], companySize: '10-200 employees', location: 'United States' },
  schedule: { discoveryTime: '09:00', emailSendTime: '10:00', replyCheckInterval: 5, reportTime: '18:00' },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings({
        apiKeys: data.settings.apiKeys || defaultSettings.apiKeys,
        email: data.settings.email || defaultSettings.email,
        ai: data.settings.ai || defaultSettings.ai,
        targeting: data.settings.targeting || defaultSettings.targeting,
        schedule: data.settings.schedule || defaultSettings.schedule,
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings. Using defaults.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  }

  function updateSection<K extends keyof SettingsState>(section: K, field: string, value: any) {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  if (loading) {
    return (
      <>
        <Header title="Settings" />
        <div className="p-6 max-w-4xl space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-4xl space-y-6">
        {message && (
          <div className={`rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Keys */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Key className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
              <p className="text-sm text-gray-500">Configure your service integrations</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Apollo.io API Key</label>
              <input
                type="password"
                value={settings.apiKeys.apolloApiKey}
                onChange={e => updateSection('apiKeys', 'apolloApiKey', e.target.value)}
                placeholder="sk-apollo-..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gemini API Key</label>
              <input
                type="password"
                value={settings.apiKeys.geminiApiKey}
                onChange={e => updateSection('apiKeys', 'geminiApiKey', e.target.value)}
                placeholder="AIza..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google OAuth Refresh Token</label>
              <input
                type="password"
                value={settings.apiKeys.googleRefreshToken}
                onChange={e => updateSection('apiKeys', 'googleRefreshToken', e.target.value)}
                placeholder="1//..."
                className="input-field"
              />
            </div>
          </div>
        </section>

        {/* Email Settings */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
              <p className="text-sm text-gray-500">Sending limits and sender identity</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Email</label>
              <input
                type="email"
                value={settings.email.senderEmail}
                onChange={e => updateSection('email', 'senderEmail', e.target.value)}
                placeholder="you@company.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Name</label>
              <input
                type="text"
                value={settings.email.senderName}
                onChange={e => updateSection('email', 'senderName', e.target.value)}
                placeholder="Your Name"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Send Limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={settings.email.dailySendLimit}
                onChange={e => updateSection('email', 'dailySendLimit', Number(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Between 1 and 500 emails per day</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Calendly Link</label>
              <input
                type="url"
                value={settings.email.calendlyLink}
                onChange={e => updateSection('email', 'calendlyLink', e.target.value)}
                placeholder="https://calendly.com/your-link"
                className="input-field"
              />
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Bot className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Agent</h2>
              <p className="text-sm text-gray-500">Configure the AI reply handler</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Model</label>
              <select
                value={settings.ai.model}
                onChange={e => updateSection('ai', 'model', e.target.value)}
                className="input-field"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (Latest)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast, Cheap)</option>
                <option value="gemini-2.0-pro">Gemini 2.0 Pro (Balanced)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confidence Threshold</label>
              <input
                type="number"
                step={0.05}
                min={0.5}
                max={1}
                value={settings.ai.confidenceThreshold}
                onChange={e => updateSection('ai', 'confidenceThreshold', Number(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Replies below this threshold need manual review (0.5 - 1.0)</p>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.ai.autoReplyPositive}
                  onChange={e => updateSection('ai', 'autoReplyPositive', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Auto-reply to positive messages with Calendly link</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.ai.autoUnsubscribe}
                  onChange={e => updateSection('ai', 'autoUnsubscribe', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Auto-unsubscribe negative/opt-out replies</span>
              </label>
            </div>
          </div>
        </section>

        {/* Prospect Targeting */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Globe className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Prospect Targeting</h2>
              <p className="text-sm text-gray-500">Define your ideal customer profile</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Titles</label>
              <input
                type="text"
                value={settings.targeting.titles.join(', ')}
                onChange={e => updateSection('targeting', 'titles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="CEO, CTO, VP Engineering"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industries</label>
              <input
                type="text"
                value={settings.targeting.industries.join(', ')}
                onChange={e => updateSection('targeting', 'industries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="SaaS, E-commerce, FinTech"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
              <input
                type="text"
                value={settings.targeting.companySize}
                onChange={e => updateSection('targeting', 'companySize', e.target.value)}
                placeholder="10-200 employees"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={settings.targeting.location}
                onChange={e => updateSection('targeting', 'location', e.target.value)}
                placeholder="United States"
                className="input-field"
              />
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
              <p className="text-sm text-gray-500">When the agent runs its tasks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Discovery Time</label>
              <input
                type="time"
                value={settings.schedule.discoveryTime}
                onChange={e => updateSection('schedule', 'discoveryTime', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Send Time</label>
              <input
                type="time"
                value={settings.schedule.emailSendTime}
                onChange={e => updateSection('schedule', 'emailSendTime', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reply Check Interval</label>
              <select
                value={settings.schedule.replyCheckInterval}
                onChange={e => updateSection('schedule', 'replyCheckInterval', Number(e.target.value))}
                className="input-field"
              >
                <option value={5}>Every 5 minutes</option>
                <option value={10}>Every 10 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Report Time</label>
              <input
                type="time"
                value={settings.schedule.reportTime}
                onChange={e => updateSection('schedule', 'reportTime', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  );
}

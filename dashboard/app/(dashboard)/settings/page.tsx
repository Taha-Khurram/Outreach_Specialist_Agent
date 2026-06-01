'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Save, Key, Mail, Globe, Bot, Bell, Target, Loader2, Zap, FileBarChart, ShieldAlert, Forward } from 'lucide-react';

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
  goals: {
    monthlyDealTarget: number;
  };
}

const defaultSettings: SettingsState = {
  apiKeys: { apolloApiKey: '', geminiApiKey: '', googleRefreshToken: '' },
  email: { senderEmail: '', senderName: '', dailySendLimit: 50, calendlyLink: '' },
  ai: { model: 'gemini-3-flash-preview', confidenceThreshold: 0.8, autoReplyPositive: true, autoUnsubscribe: true },
  targeting: { titles: ['CEO', 'CTO', 'VP Engineering', 'Founder'], industries: ['SaaS', 'E-commerce', 'FinTech', 'HealthTech'], companySize: '10-200 employees', location: 'United States' },
  schedule: { discoveryTime: '09:00', emailSendTime: '10:00', replyCheckInterval: 5, reportTime: '18:00' },
  goals: { monthlyDealTarget: 2 },
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
      const s = data.settings || {};
      setSettings({
        apiKeys: { ...defaultSettings.apiKeys, ...s.apiKeys },
        email: { ...defaultSettings.email, ...s.email },
        ai: { ...defaultSettings.ai, ...s.ai },
        targeting: { ...defaultSettings.targeting, ...s.targeting },
        schedule: { ...defaultSettings.schedule, ...s.schedule },
        goals: { ...defaultSettings.goals, ...s.goals },
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
      const payload = {
        ...settings,
        email: {
          ...settings.email,
          senderEmail: settings.email.senderEmail.trim(),
          calendlyLink: settings.email.calendlyLink.trim(),
          dailySendLimit: settings.email.dailySendLimit || 50,
        },
        ai: {
          ...settings.ai,
          confidenceThreshold: settings.ai.confidenceThreshold || 0.8,
        },
        schedule: {
          ...settings.schedule,
          replyCheckInterval: settings.schedule.replyCheckInterval || 5,
        },
        goals: {
          ...settings.goals,
          monthlyDealTarget: settings.goals.monthlyDealTarget || 2,
        },
      };
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.details
          ? Object.entries(data.details).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ')
          : '';
        throw new Error(detail || data.error || 'Failed to save settings');
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
          {settings.email.calendlyLink && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Calendly Webhook URL</p>
              <code className="text-xs text-gray-500 break-all select-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/calendly` : '/api/webhooks/calendly'}</code>
              <p className="text-xs text-gray-400 mt-1">Add this URL in your Calendly webhook settings to auto-track meetings.</p>
            </div>
          )}
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

        {/* Goals */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <Target className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
              <p className="text-sm text-gray-500">Set your monthly targets</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Deal Target</label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.goals.monthlyDealTarget}
                onChange={e => updateSection('goals', 'monthlyDealTarget', Number(e.target.value))}
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">Number of deals you aim to close per month</p>
            </div>
          </div>
        </section>

        {/* Operations */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manual Operations</h2>
              <p className="text-sm text-gray-500">Trigger background tasks on demand</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OperationButton
              icon={<FileBarChart className="h-4 w-4" />}
              label="Generate Weekly Report"
              description="Compile and email a summary of the past 7 days"
              endpoint="/api/reports/weekly"
            />
            <OperationButton
              icon={<ShieldAlert className="h-4 w-4" />}
              label="Check Bounces"
              description="Scan inbox for bounce notifications and update prospects"
              endpoint="/api/bounces"
            />
            <OperationButton
              icon={<Forward className="h-4 w-4" />}
              label="Process Follow-ups"
              description="Send pending campaign follow-up emails now"
              endpoint="/api/campaigns/process"
            />
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

function OperationButton({ icon, label, description, endpoint }: { icon: React.ReactNode; label: string; description: string; endpoint: string }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const summary = data.skipped
        ? `Skipped: ${data.reason}`
        : Object.entries(data).filter(([k]) => k !== 'period' && k !== 'pipeline').map(([k, v]) => typeof v === 'number' || typeof v === 'string' ? `${k}: ${v}` : null).filter(Boolean).join(', ');
      setResult({ type: 'success', text: summary || 'Done' });
    } catch (err: any) {
      setResult({ type: 'error', text: err.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
      <button onClick={handleRun} disabled={running}
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {running ? 'Running...' : 'Run Now'}
      </button>
      {result && (
        <p className={`text-xs mt-1 ${result.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}

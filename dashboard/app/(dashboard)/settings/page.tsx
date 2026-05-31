'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Save, Key, Mail, Globe, Bot, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <Header title="Settings" />
      <div className="p-6 max-w-4xl space-y-6">
        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Settings saved successfully.
          </div>
        )}

        {/* API Keys */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
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
              <input type="password" defaultValue="sk-apollo-xxxx" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Anthropic API Key (Claude)</label>
              <input type="password" defaultValue="sk-ant-xxxx" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google OAuth Refresh Token</label>
              <input type="password" defaultValue="1//xxxxx" className="input-field" />
            </div>
          </div>
        </section>

        {/* Email Settings */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
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
              <input type="email" defaultValue="alex@topclientcloser.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Name</label>
              <input type="text" defaultValue="Alex Chen" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Send Limit</label>
              <input type="number" defaultValue="50" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Calendly Link</label>
              <input type="url" defaultValue="https://calendly.com/your-link" className="input-field" />
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Agent</h2>
              <p className="text-sm text-gray-500">Configure the AI reply handler</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Model</label>
              <select className="input-field">
                <option>Claude Haiku (Fast, Cheap)</option>
                <option>Claude Sonnet (Balanced)</option>
                <option>Claude Opus (Most Capable)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confidence Threshold</label>
              <input type="number" step="0.05" min="0.5" max="1" defaultValue="0.8" className="input-field" />
              <p className="text-xs text-gray-400 mt-1">Replies below this threshold need manual review</p>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Auto-reply to positive messages with Calendly link</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Auto-unsubscribe negative/opt-out replies</span>
              </label>
            </div>
          </div>
        </section>

        {/* Prospect Targeting */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Prospect Targeting</h2>
              <p className="text-sm text-gray-500">Define your ideal customer profile</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Titles</label>
              <input type="text" defaultValue="CEO, CTO, VP Engineering, Founder" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industries</label>
              <input type="text" defaultValue="SaaS, E-commerce, FinTech, HealthTech" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
              <input type="text" defaultValue="10-200 employees" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input type="text" defaultValue="United States" className="input-field" />
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
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
              <input type="time" defaultValue="09:00" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Send Time</label>
              <input type="time" defaultValue="10:00" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reply Check Interval</label>
              <select className="input-field">
                <option>Every 5 minutes</option>
                <option>Every 10 minutes</option>
                <option>Every 15 minutes</option>
                <option>Every 30 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Report Time</label>
              <input type="time" defaultValue="18:00" className="input-field" />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}

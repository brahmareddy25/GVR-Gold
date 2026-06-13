'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle2, Phone, MapPin, Share2 } from 'lucide-react';
import type { StoreSettings } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load store settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Store settings saved successfully!' });
        setSettings(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner admin-spinner-lg" />
        <span>Loading settings...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Settings</h1>
          <p className="admin-page-subtitle">Manage your business details, contact information, and social links.</p>
        </div>
      </div>

      {message && (
        <div className={`admin-alert admin-alert-${message.type}`} style={{ marginBottom: 24, padding: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: message.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: message.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
          
          {/* General Information */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <h3 className="admin-card-title">General Details</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Store Name *</label>
                <input required type="text" className="admin-form-input" placeholder="e.g. GVR Gold & Silver" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Tagline</label>
                <input type="text" className="admin-form-input" placeholder="e.g. Crafted for Generations" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Homepage Hero Headline</label>
                <input type="text" className="admin-form-input" placeholder="e.g. Discover exquisite gold and silver..." value={settings.heroHeadline} onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">About Us Snippet</label>
                <textarea className="admin-form-input" rows={4} placeholder="Write a short description about your brand's heritage and mission..." value={settings.aboutContent} onChange={(e) => setSettings({ ...settings, aboutContent: e.target.value })} style={{ resize: 'vertical' }}></textarea>
              </div>
              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <input 
                  type="checkbox" 
                  id="showLiveRates" 
                  checked={settings.showLiveRates ?? true} 
                  onChange={(e) => setSettings({ ...settings, showLiveRates: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="showLiveRates" className="admin-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Show Live Market Prices on Homepage
                </label>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Phone size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="admin-card-title">Contact Information</h3>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="admin-form-group">
                  <label className="admin-label">Phone Number</label>
                  <input type="text" className="admin-form-input" placeholder="e.g. 9704223288" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">WhatsApp Number</label>
                  <input type="text" className="admin-form-input" placeholder="e.g. 919704223288" value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
                  <p className="admin-form-hint">Used for WhatsApp click-to-chat links.</p>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Email Address</label>
                <input type="email" className="admin-form-input" placeholder="e.g. yaswanthgedela27@gmail.com" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Share2 size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="admin-card-title">Social Links</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Instagram URL</label>
                <input type="url" className="admin-form-input" placeholder="https://instagram.com/..." value={settings.socialLinks?.instagram || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Facebook URL</label>
                <input type="url" className="admin-form-input" placeholder="https://facebook.com/..." value={settings.socialLinks?.facebook || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">YouTube URL</label>
                <input type="url" className="admin-form-input" placeholder="https://youtube.com/..." value={settings.socialLinks?.youtube || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, youtube: e.target.value } })} />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Twitter / X URL</label>
                <input type="url" className="admin-form-input" placeholder="https://twitter.com/..." value={settings.socialLinks?.twitter || ''} onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })} />
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 64 }}>
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-lg" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

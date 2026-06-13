'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle2, AlertCircle, DollarSign, Cpu } from 'lucide-react';
import type { RatesConfig } from '@/lib/types';

export default function PricingPage() {
  const [ratesConfig, setRatesConfig] = useState<RatesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success) {
        setRatesConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      setMessage({ type: 'error', text: 'Failed to load live rates.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratesConfig) return;

    setSaving(true);
    setMessage(null);

    // Auto update timestamp
    const configToSave = {
      ...ratesConfig,
      currentRates: {
        ...ratesConfig.currentRates,
        source: ratesConfig.useApiRates ? 'api' : 'manual',
        lastUpdated: new Date().toISOString()
      }
    };

    try {
      const res = await fetch('/api/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Live rates saved successfully!' });
        setRatesConfig(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save rates.' });
      }
    } catch (error) {
      console.error('Failed to save rates:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner admin-spinner-lg" />
        <span>Loading Live Rates...</span>
      </div>
    );
  }

  if (!ratesConfig) return null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Live Market Rates</h1>
          <p className="admin-page-subtitle">Manage today's Gold and Silver prices for your catalog.</p>
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
          
          {/* Rate Mode Toggle */}
          <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <div className="admin-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Cpu size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="admin-card-title">Live Rates API Integration</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  id="useApiRates" 
                  checked={ratesConfig.useApiRates} 
                  onChange={(e) => setRatesConfig({ ...ratesConfig, useApiRates: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="useApiRates" className="admin-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '1.1rem' }}>
                  Enable Auto-Fetch from Live Rates API
                </label>
              </div>
              {ratesConfig.useApiRates && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <p style={{ color: 'var(--admin-text-secondary)', marginBottom: '12px' }}>
                    When enabled, the system will automatically fetch global spot prices for Gold and Silver. Manual entry is disabled.
                  </p>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">API Key (Optional)</label>
                    <input 
                      type="password" 
                      className="admin-form-input" 
                      placeholder="Enter your API Key..." 
                      value={ratesConfig.apiKey || ''} 
                      onChange={(e) => setRatesConfig({ ...ratesConfig, apiKey: e.target.value })} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="admin-card" style={{ opacity: ratesConfig.useApiRates ? 0.6 : 1, pointerEvents: ratesConfig.useApiRates ? 'none' : 'auto' }}>
            <div className="admin-card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <DollarSign size={18} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="admin-card-title">Manual Rates Entry (Per Gram)</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form-group">
                <label className="admin-label">Gold 24K Rate (₹)</label>
                <input 
                  required={!ratesConfig.useApiRates} 
                  type="number" 
                  step="0.01" 
                  className="admin-form-input" 
                  value={ratesConfig.currentRates.gold24k || ''} 
                  onChange={(e) => setRatesConfig({ ...ratesConfig, currentRates: { ...ratesConfig.currentRates, gold24k: parseFloat(e.target.value) || 0 } })} 
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Gold 22K Rate (₹)</label>
                <input 
                  required={!ratesConfig.useApiRates} 
                  type="number" 
                  step="0.01" 
                  className="admin-form-input" 
                  value={ratesConfig.currentRates.gold22k || ''} 
                  onChange={(e) => setRatesConfig({ ...ratesConfig, currentRates: { ...ratesConfig.currentRates, gold22k: parseFloat(e.target.value) || 0 } })} 
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Silver Rate (₹)</label>
                <input 
                  required={!ratesConfig.useApiRates} 
                  type="number" 
                  step="0.01" 
                  className="admin-form-input" 
                  value={ratesConfig.currentRates.silver || ''} 
                  onChange={(e) => setRatesConfig({ ...ratesConfig, currentRates: { ...ratesConfig.currentRates, silver: parseFloat(e.target.value) || 0 } })} 
                />
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginTop: '16px' }}>
                Last Updated: {new Date(ratesConfig.currentRates.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 64 }}>
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-lg" disabled={saving}>
            {saving ? <RefreshCw className="spin" size={20} /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Rates Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

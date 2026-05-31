'use client';
import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DarkCtx } from '@/lib/news-contexts';
import { ACCENT } from '@/lib/news-utils';

const SR_ONLY = { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

export default function SubscriptionPlans({ open, onClose }) {
  const dark = useContext(DarkCtx);
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const bdr = dark ? '#2e3347' : '#E6E8EB';

  useEffect(() => {
    if (!open) return;
    fetch('/api/subscriptions/plans')
      .then(r => r.json())
      .then(d => { setPlans(d.plans || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '860px', borderRadius: '16px', padding: '32px' }}>
        <DialogTitle style={{ fontSize: '20px', fontWeight: 700, color: dark ? '#e5e7eb' : '#333', textAlign: 'center' }}>Choose Your Plan</DialogTitle>
        <DialogDescription style={SR_ONLY}>Browse and select a subscription plan.</DialogDescription>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="loader" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '20px 0' }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ border: `2px solid ${plan.popular ? ACCENT : bdr}`, borderRadius: '12px', padding: '20px', position: 'relative', backgroundColor: plan.popular ? (dark ? 'rgba(59,175,218,0.08)' : 'rgba(59,175,218,0.04)') : 'transparent' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: ACCENT, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>Most Popular</div>
                )}
                <p style={{ fontWeight: 700, fontSize: '14px', color: dark ? '#e5e7eb' : '#333', marginBottom: '8px' }}>{plan.name}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: ACCENT, marginBottom: '4px' }}>
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  {plan.price > 0 && <span style={{ fontSize: '13px', color: '#8A8F98', fontWeight: 400 }}>/{plan.period}</span>}
                </p>
                <ul style={{ listStyle: 'none', margin: '12px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: dark ? '#9ca3af' : '#555' }}>
                      <CheckCircle style={{ width: '13px', height: '13px', color: '#38a169', flexShrink: 0, marginTop: '1px' }} />{f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={plan.id === 'free'}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: plan.popular ? 'none' : `1px solid ${bdr}`, backgroundColor: plan.popular ? ACCENT : 'transparent', color: plan.popular ? 'white' : dark ? '#9ca3af' : '#555', fontSize: '13px', fontWeight: 600, cursor: plan.id === 'free' ? 'default' : 'pointer', opacity: plan.id === 'free' ? 0.6 : 1 }}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

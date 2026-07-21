'use client';
import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DarkCtx } from '@/lib/news-contexts';
import { ACCENT } from '@/lib/news-utils';
import { toast } from 'sonner';

const SR_ONLY = { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

export default function SubscriptionPlans({ open, onClose, user, userId }) {
  const dark = useContext(DarkCtx);
  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [subscribing, setSubscribing] = useState(null);
  const bdr = dark ? '#2e3347' : '#E6E8EB';

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/subscriptions/plans')
      .then(r => r.json())
      .then(d => { setPlans(d.plans || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;
    fetch(`/api/subscriptions/user/${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.subscription?.plan) {
          setCurrentPlan(d.subscription.plan);
        }
      })
      .catch(err => console.error('Error fetching user subscription:', err));
  }, [open, userId]);

  const handleSubscribe = async (planId) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      onClose();
      return;
    }

    if (planId === 'free' || planId === currentPlan) {
      return;
    }

    setSubscribing(planId);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          plan: planId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to subscribe');
      }

      const data = await response.json();
      setCurrentPlan(planId);
      toast.success(`Upgraded to ${plans.find(p => p.id === planId)?.name} plan!`);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const modalContent = (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '860px', borderRadius: '16px', padding: '32px' }}>
        <DialogTitle style={{ fontSize: '20px', fontWeight: 700, color: dark ? '#e5e7eb' : '#333', textAlign: 'center' }}>Choose Your Plan</DialogTitle>
        <DialogDescription style={SR_ONLY}>Browse and select a subscription plan.</DialogDescription>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="loader" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '20px 0' }}>
            {plans.map(plan => {
              const isCurrentPlan = currentPlan === plan.id;
              const isSubscribing = subscribing === plan.id;

              return (
                <div key={plan.id} style={{ border: `2px solid ${plan.popular ? ACCENT : bdr}`, borderRadius: '12px', padding: '20px', position: 'relative', backgroundColor: isCurrentPlan ? (dark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)') : plan.popular ? (dark ? 'rgba(59,175,218,0.08)' : 'rgba(59,175,218,0.04)') : 'transparent' }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: ACCENT, color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap' }}>Most Popular</div>
                  )}
                  {isCurrentPlan && (
                    <div style={{ position: 'absolute', top: '-12px', right: '12px', backgroundColor: '#22c55e', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Current
                    </div>
                  )}
                  <p style={{ fontWeight: 700, fontSize: '14px', color: dark ? '#e5e7eb' : '#333', marginBottom: '8px' }}>{plan.name}</p>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: ACCENT, marginBottom: '4px' }}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                    {plan.price > 0 && <span style={{ fontSize: '13px', color: dark ? '#9BA5B4' : '#6B7280', fontWeight: 400 }}>/{plan.period}</span>}
                  </p>
                  <ul style={{ listStyle: 'none', margin: '12px 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: dark ? '#9ca3af' : '#555' }}>
                        <CheckCircle style={{ width: '13px', height: '13px', color: '#38a169', flexShrink: 0, marginTop: '1px' }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrentPlan || isSubscribing || (plan.id === 'free' && !user)}
                    onClick={() => handleSubscribe(plan.id)}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: isCurrentPlan ? 'none' : plan.popular ? 'none' : `1px solid ${bdr}`, backgroundColor: isCurrentPlan ? '#22c55e' : plan.popular ? ACCENT : 'transparent', color: isCurrentPlan || plan.popular ? 'white' : dark ? '#9ca3af' : '#555', fontSize: '13px', fontWeight: 600, cursor: isCurrentPlan ? 'default' : isSubscribing ? 'wait' : 'pointer', opacity: isCurrentPlan || isSubscribing ? 1 : 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                  >
                    {isSubscribing ? (
                      <>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Upgrading...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Free Plan'
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!user && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: dark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', border: `1px solid ${dark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: dark ? '#93c5fd' : '#1e40af' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Sign in to subscribe to paid plans</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

'use client';
import React from 'react';
import { Apple, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const SR_ONLY = { position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

export default function AuthDialog({ open, onClose, onGoogleSignIn, onAppleSignIn, loading, bdr }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ borderRadius: '20px', padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', border: `1px solid ${bdr}`, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxWidth: '380px' }}>
        <DialogTitle style={SR_ONLY}>Sign in to KhabarON</DialogTitle>
        <DialogDescription style={SR_ONLY}>Choose a provider to sign in.</DialogDescription>

        <div style={{ padding: '28px', background: 'linear-gradient(135deg, #3BAFDA, #6C63FF)', color: 'white', textAlign: 'center', position: 'relative' }}>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: '10px', top: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>Welcome Back 👋</h2>
          <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>Sign in to continue to KhabarON</p>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onGoogleSignIn} disabled={loading}
            style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E6E8EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {loading ? <div className="loader" style={{ width: '18px' }} /> : (
              <><img src="https://www.svgrepo.com/show/475656/google-color.svg" width="18" alt="Google" />Continue with Google</>
            )}
          </button>
          <button
            onClick={onAppleSignIn} disabled={loading}
            style={{ padding: '12px', borderRadius: '10px', border: '1px solid #E6E8EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Apple size={16} />Continue with Apple
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

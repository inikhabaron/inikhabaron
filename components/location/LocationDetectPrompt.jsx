'use client';

import { MapPin, X } from 'lucide-react';
import useLocationAutoDetect from '@/hooks/useLocationAutoDetect';

export default function LocationDetectPrompt({ isSignedIn, dark, isHindi }) {
  const { shouldPrompt, step, candidate, error, requestDetect, confirmCandidate, dismiss } = useLocationAutoDetect(isSignedIn);

  if (!shouldPrompt) return null;

  const bg = dark ? '#161B27' : '#FFFFFF';
  const border = dark ? '#252E40' : '#E8EAED';
  const text = dark ? '#E8ECF0' : '#111827';
  const subtext = dark ? '#9BA5B4' : '#4B5563';

  return (
    <div
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 1000, maxWidth: 340, width: 'calc(100% - 40px)',
        background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 18,
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      }}
    >
      <button
        onClick={dismiss}
        aria-label={isHindi ? 'बंद करें' : 'Dismiss'}
        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: subtext }}
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <MapPin size={20} color="#3BAFDA" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          {step === 'confirm' && candidate ? (
            <>
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: text }}>
                {isHindi
                  ? `${candidate.districtName || candidate.stateName} की खबरें दिखाएं?`
                  : `Show news from ${candidate.districtName ? `${candidate.districtName}, ` : ''}${candidate.stateName}?`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={confirmCandidate}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3BAFDA', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isHindi ? 'हां' : 'Yes'}
                </button>
                <button
                  onClick={dismiss}
                  style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isHindi ? 'मैन्युअल रूप से चुनें' : 'Choose manually'}
                </button>
              </div>
            </>
          ) : step === 'error' ? (
            <>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: subtext }}>
                {isHindi ? 'लोकेशन तय नहीं हो सकी।' : (error || 'Unable to determine your location.')}
              </p>
              <button
                onClick={dismiss}
                style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {isHindi ? 'ठीक है' : 'OK'}
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: text }}>
                {isHindi ? 'क्या हम आपकी लोकेशन का उपयोग करें?' : 'Use your location?'}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: subtext }}>
                {isHindi ? 'अपने क्षेत्र की खबरें देखने के लिए' : 'To show you news relevant to your area'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={requestDetect}
                  disabled={step === 'detecting'}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3BAFDA', color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: step === 'detecting' ? 'default' : 'pointer',
                    opacity: step === 'detecting' ? 0.7 : 1,
                  }}
                >
                  {step === 'detecting' ? (isHindi ? 'पता लगा रहे हैं...' : 'Detecting...') : (isHindi ? 'अनुमति दें' : 'Allow')}
                </button>
                <button
                  onClick={dismiss}
                  style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isHindi ? 'अभी नहीं' : 'Not now'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

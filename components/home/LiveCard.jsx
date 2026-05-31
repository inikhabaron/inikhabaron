'use client';

import React from 'react';
import { EDITORIAL_RED } from '@/lib/news-utils';

export default function LiveCard({
  youtubeLive,
  dark,
  bdr,
}) {
  return (
    <div
      className="kn-live-card"
      style={{
        background: dark ? '#161B27' : '#fff',
        border: `1px solid ${bdr}`,
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: `1px solid ${bdr}`,
          background: dark ? '#0F172A' : '#fafafa',
        }}
      >
        <span
          style={{
            color: EDITORIAL_RED,
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          ● LIVE TV
        </span>

        <span
          style={{
            marginLeft: '12px',
            color: '#9CA3AF',
            fontSize: '12px',
          }}
        >
          {youtubeLive?.title || 'Live News Broadcast'}
        </span>
      </div>

      {/* Video */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          background: '#000',
        }}
      >
        {youtubeLive?.videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeLive.videoId}?autoplay=1&rel=0`}
            title="Live TV"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            Live stream unavailable
          </div>
        )}
      </div>
    </div>
  );
}
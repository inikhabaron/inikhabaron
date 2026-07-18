'use client';

import { Users, CheckCircle2, XCircle } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

const cards = [
  { key: 'total', label: 'Total Subscribers', icon: Users, color: '#2563EB' },
  { key: 'active', label: 'Active', icon: CheckCircle2, color: '#10B981' },
  { key: 'unsubscribed', label: 'Unsubscribed', icon: XCircle, color: '#6B7280' },
];

export function NewsletterStats({ stats = {} }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
        gap: 20,
        marginBottom: 28,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            style={{ ...DS.card, display: 'flex', alignItems: 'center', gap: 18, padding: 22 }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${card.color}15`,
              }}
            >
              <Icon size={26} color={card.color} />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>
                {stats?.[card.key] ?? 0}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

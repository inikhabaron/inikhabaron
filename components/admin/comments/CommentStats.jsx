'use client';

import { MessageSquare } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { EyeOff } from 'lucide-react';
import { XCircle } from 'lucide-react';

import { DS } from '@/components/admin/design-system';

const cards = [
  {
    key: 'pending',
    label: 'Pending',
    icon: AlertTriangle,
    color: '#F59E0B',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: CheckCircle2,
    color: '#10B981',
  },
  {
    key: 'reported',
    label: 'Reported',
    icon: MessageSquare,
    color: '#EF4444',
  },
  {
    key: 'hidden',
    label: 'Hidden',
    icon: EyeOff,
    color: '#6366F1',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: XCircle,
    color: '#6B7280',
  },
];

export function CommentStats({
  stats = {},
}) {
  return (
    <div
      style={{
        display: 'grid',

        gridTemplateColumns:
          'repeat(auto-fit,minmax(180px,1fr))',

        gap: 20,

        marginBottom: 28,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            style={{
              ...DS.card,

              display: 'flex',
              alignItems: 'center',

              gap: 18,

              padding: 22,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,

                borderRadius: 14,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                background:
                  `${card.color}15`,
              }}
            >
              <Icon
                size={26}
                color={card.color}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,

                  color: '#6B7280',

                  marginBottom: 6,

                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>

              <div
                style={{
                  fontSize: 28,

                  fontWeight: 700,

                  color: '#111827',
                }}
              >
                {stats?.[card.key] ?? 0}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
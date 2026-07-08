'use client';

import { useEffect, useState } from 'react';

import {
  ShieldCheck,
  Save,
} from 'lucide-react';

import { DS } from '@/components/admin/design-system';

export function CommentModerationCard({
  settings = {},
  onSave,
}) {
  const [mode, setMode] =
    useState('auto');

  const [delay, setDelay] =
    useState(3);

  useEffect(() => {
    if (!settings) return;

    setMode(
      settings.mode || 'auto'
    );

    setDelay(
      settings.delaySeconds || 3
    );
  }, [settings]);

  function handleSave() {
    onSave?.({
      mode,
      delaySeconds: Number(delay),
    });
  }

  return (
    <div
      style={{
        ...DS.card,

        padding: 24,

        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',

          alignItems: 'center',

          gap: 12,

          marginBottom: 20,
        }}
      >
        <ShieldCheck
          size={22}
          color="#2563EB"
        />

        <div>
          <div
            style={{
              fontWeight: 700,

              fontSize: 18,
            }}
          >
            Comment Moderation
          </div>

          <div
            style={{
              color: '#6B7280',

              fontSize: 14,

              marginTop: 2,
            }}
          >
            Configure how new
            reader comments are
            approved.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(auto-fit,minmax(220px,1fr))',

          gap: 22,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',

              marginBottom: 8,

              fontWeight: 600,

              fontSize: 14,
            }}
          >
            Moderation Mode
          </label>

          <select
            value={mode}
            onChange={(e) =>
              setMode(
                e.target.value
              )
            }
            style={{
              width: '100%',

              padding:
                '10px 14px',

              border:
                '1px solid #E5E7EB',

              borderRadius: 10,

              fontSize: 14,

              outline: 'none',
            }}
          >
            <option value="auto">
              Auto Approve
            </option>

            <option value="manual">
              Manual Approval
            </option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',

              marginBottom: 8,

              fontWeight: 600,

              fontSize: 14,
            }}
          >
            Auto Approval Delay
          </label>

          <input
            type="number"

            min={0}

            max={300}

            value={delay}

            disabled={
              mode !== 'auto'
            }

            onChange={(e) =>
              setDelay(
                e.target.value
              )
            }

            style={{
              width: '100%',

              padding:
                '10px 14px',

              border:
                '1px solid #E5E7EB',

              borderRadius: 10,

              fontSize: 14,

              outline: 'none',

              background:
                mode === 'auto'
                  ? '#fff'
                  : '#F9FAFB',
            }}
          />

          <div
            style={{
              marginTop: 8,

              color: '#6B7280',

              fontSize: 13,
            }}
          >
            Comments are
            automatically approved
            after this delay.
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,

          display: 'flex',

          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={handleSave}
          style={{
            display: 'inline-flex',

            alignItems: 'center',

            gap: 8,

            background: '#2563EB',

            color: '#fff',

            border: 'none',

            borderRadius: 10,

            padding:
              '10px 18px',

            cursor: 'pointer',

            fontWeight: 600,
          }}
        >
          <Save size={16} />

          Save Settings
        </button>
      </div>
    </div>
  );
}
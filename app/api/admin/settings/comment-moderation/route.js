import { json, preflight } from '@/lib/api/cors';

import { getUserFromToken } from '@/lib/auth/admin/token';

import {
  canAccessAdminPanel,
  checkRole,
} from '@/lib/auth/permissions';

import {
  getCommentModerationSettings,
  updateCommentModerationSettings,
  MAX_ALERT_EMAILS,
} from '@/lib/services/settings/commentModerationService';

import { getCaptchaConfig } from '@/lib/services/comments/guestCaptcha';

const EMAIL_PATTERN = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

// Whether guest-comment CAPTCHA is live is an environment fact, not a stored
// setting; surfaced read-only so the admin UI can say so (and warn when guests
// are posting without it). Never includes the secret.
function captchaStatus() {
  const config = getCaptchaConfig();

  return {
    provider: config.provider,
    configured: config.configured,
    required: config.required,
  };
}

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

export async function GET(request) {
  try {

    const admin =
      await getUserFromToken(request);

    if (
      !admin ||
      !canAccessAdminPanel(admin)
    ) {
      return json(
        {
          error: 'Unauthorized',
        },
        {
          status: 403,
        }
      );
    }

    const settings =
      await getCommentModerationSettings();

    return json({
      success: true,
      settings,
      captcha: captchaStatus(),
    });

  } catch (error) {

    console.error(
      'GET /api/admin/settings/comment-moderation',
      error
    );

    return json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );

  }
}

export async function POST(request) {
  try {

    const admin =
      await getUserFromToken(request);

    if (
      !admin ||
      !canAccessAdminPanel(admin)
    ) {
      return json(
        {
          error: 'Unauthorized',
        },
        {
          status: 403,
        }
      );
    }

    // Reading is open to everyone who can use the admin panel; WRITING is
    // admin-only. These settings switch guest commenting on and off, change how
    // comments are approved, and choose who internal alerts are emailed to —
    // none of which a reporter or editor should be able to change.
    if (!checkRole(admin, ['admin'])) {
      return json(
        {
          error: 'Only an admin can change comment settings',
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const mode =
      body.mode;

    const delaySeconds =
      Number(
        body.delaySeconds
      );

    if (
      ![
        'auto',
        'manual',
      ].includes(mode)
    ) {
      return json(
        {
          error:
            'Invalid moderation mode',
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(delaySeconds) ||
      delaySeconds < 0
    ) {
      return json(
        {
          error:
            'Invalid delay',
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.allowGuestComments !== undefined &&
      typeof body.allowGuestComments !== 'boolean'
    ) {
      return json(
        {
          error:
            'allowGuestComments must be a boolean',
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.alertEnabled !== undefined &&
      typeof body.alertEnabled !== 'boolean'
    ) {
      return json(
        { error: 'alertEnabled must be a boolean' },
        { status: 400 }
      );
    }

    // 0 turns the count-based alert off (the 24h-overdue alert still applies).
    if (
      body.alertThreshold !== undefined &&
      !(
        Number.isInteger(body.alertThreshold) &&
        body.alertThreshold >= 0 &&
        body.alertThreshold <= 1000
      )
    ) {
      return json(
        { error: 'alertThreshold must be a whole number from 0 to 1000' },
        { status: 400 }
      );
    }

    let alertEmails;

    if (body.alertEmails !== undefined) {
      if (
        !Array.isArray(body.alertEmails) ||
        body.alertEmails.length > MAX_ALERT_EMAILS ||
        !body.alertEmails.every(
          (email) =>
            typeof email === 'string' &&
            email.length <= 254 &&
            EMAIL_PATTERN.test(email.trim())
        )
      ) {
        return json(
          {
            error: `alertEmails must be a list of at most ${MAX_ALERT_EMAILS} valid email addresses`,
          },
          { status: 400 }
        );
      }

      alertEmails = [
        ...new Set(
          body.alertEmails.map((email) => email.trim().toLowerCase())
        ),
      ];
    }

    const settings =
      await updateCommentModerationSettings(
        {
          mode,
          delaySeconds,
          allowGuestComments:
            body.allowGuestComments,
          alertEnabled:
            body.alertEnabled,
          alertThreshold:
            body.alertThreshold,
          alertEmails,
        },
        admin
      );

    return json({
      success: true,
      settings,
      captcha: captchaStatus(),
    });

  } catch (error) {

    console.error(
      'POST /api/admin/settings/comment-moderation',
      error
    );

    return json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );

  }
}

import { json, preflight } from '@/lib/api/cors';

import { getUserFromToken } from '@/lib/auth/admin/token';

import {
  canAccessAdminPanel,
} from '@/lib/auth/permissions';

import {
  getCommentModerationSettings,
  updateCommentModerationSettings,
} from '@/lib/services/settings/commentModerationService';

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

    const settings =
      await updateCommentModerationSettings(
        {
          mode,
          delaySeconds,
        },
        admin
      );

    return json({
      success: true,
      settings,
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

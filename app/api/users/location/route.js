import { getCollection } from '@/lib/mongodb';
import { COLLECTIONS } from '@/lib/constants/collections';
import { requireUser } from '@/lib/auth/user/requireUser';
import { json, preflight } from '@/lib/api/cors';

// Reads per-request state (headers/cookies/query), so it can never be
// prerendered. Declared explicitly: without this Next attempts a static render
// at build time, the attempt throws DYNAMIC_SERVER_USAGE, and the route's own
// catch block logs it as an application error — the build-log noise.
export const dynamic = 'force-dynamic';

export const OPTIONS = preflight;

/**
 * GET /api/users/location
 * Get the current user's saved location
 */
export async function GET() {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;

    return json({
      success: true,
      data: {
        ...(user.location || {
          enabled: false,
          scope: 'national',
          country: 'India',
        }),
        locationPromptSeenAt: user.locationPromptSeenAt || null,
      },
    });
  } catch (error) {
    console.error('GET /api/users/location error:', error);

    return json(
      {
        success: false,
        message: 'Failed to fetch user location.',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/location
 * Save/update the current user's location
 */
export async function PUT(request) {
  try {
    const auth = await requireUser();

    if (!auth.success) {
      return auth.response;
    }

    const { user } = auth;

    const body = await request.json();

    const country = (body.country || 'India').trim();
    const scope = body.scope || 'national';
    const stateId = body.stateId || body.state?.id || '';
    const stateName = body.stateName || body.state?.name || '';
    const stateSlug = body.stateSlug || body.state?.slug || '';
    const districtId = body.districtId || body.district?.id || '';
    const districtName = body.districtName || body.district?.name || '';
    const districtSlug = body.districtSlug || body.district?.slug || '';

    if (scope === 'state' && !stateId) {
      return json(
        {
          success: false,
          message: 'State is required.',
        },
        { status: 400 }
      );
    }

    if (scope === 'district' && (!stateId || !districtId)) {
      return json(
        {
          success: false,
          message: 'State and district are required.',
        },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    const location = {
      enabled: scope !== 'national',
      scope,
      country,
      stateId,
      stateName,
      stateSlug,
      districtId,
      districtName,
      districtSlug,
      source: body.source === 'auto' ? 'auto' : 'manual',
    };

    const update = { $set: { location, updatedAt: new Date() } };
    // Any save (manual or auto-confirmed) counts as "the prompt no longer
    // needs to be shown" — set it here too in case the client saves without
    // ever calling prompt-seen directly (e.g. a fresh manual Settings save).
    if (!user.locationPromptSeenAt) update.$set.locationPromptSeenAt = new Date();

    await usersCollection.updateOne({ id: user.id }, update);

    return json({
      success: true,
      message: 'Location updated successfully.',
      data: location,
    });
  } catch (error) {
    console.error('PUT /api/users/location error:', error);

    return json(
      {
        success: false,
        message: 'Failed to update location.',
      },
      { status: 500 }
    );
  }
}
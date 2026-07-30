import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth/user/firebase-admin';

// Must stay dynamic: as a static route Next would answer from a build-time
// snapshot and report success no matter what the runtime environment holds.
export const dynamic = 'force-dynamic';

// Reports whether Firebase Admin can actually initialize *in this
// environment*. The previous version imported adminAuth without ever calling
// it, so the check passed even when initialization was broken at runtime —
// it reported healthy while POST /api/auth/session was failing on exactly
// that initialization.
export async function GET() {
    try {
        getAdminAuth();
        return NextResponse.json({
            success: true,
            message: 'Firebase Admin initialized successfully',
        });
    } catch (err) {
        // Names the missing variable; never echoes its value.
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

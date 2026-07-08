import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/user/firebase-admin';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: 'Firebase Admin initialized successfully',
        });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err.message,
        });
    }
}
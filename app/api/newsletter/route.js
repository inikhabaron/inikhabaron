import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const existing = await db
      .collection('newsletter')
      .findOne({ email: body.email });

    if (existing) {
      return NextResponse.json(
        { error: 'Already subscribed' },
        { status: 400 }
      );
    }

    await db.collection('newsletter').insertOne({
      email: body.email,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
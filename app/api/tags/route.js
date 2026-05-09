import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tags: [
      {
        id: '1',
        name: 'Politics',
        active: true,
        popular: true,
        color: '#3BAFDA'
      },
      {
        id: '2',
        name: 'Technology',
        active: true,
        popular: true,
        color: '#10B981'
      }
    ]
  });
}
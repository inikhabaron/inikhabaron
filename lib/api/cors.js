import { NextResponse } from 'next/server';

const DEFAULT_ORIGIN = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';

export const corsHeaders = {
  'Access-Control-Allow-Origin': DEFAULT_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
};

export function json(data, init = {}) {
  const { status, headers: extraHeaders } = init;
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...(extraHeaders || {}) },
  });
}

export function preflight() {
  return NextResponse.json({}, { headers: corsHeaders });
}

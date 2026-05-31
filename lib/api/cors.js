import { NextResponse } from 'next/server';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

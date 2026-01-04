import { NextResponse } from 'next/server';

const DEFAULT_TARGET = 'https://script.google.com/macros/s/AKfycbw1rqBmcDNBDCPTPpge5TW33QP2e199lCSOVQDvXsimTnFX7-5aH0bghj6MhLClzUh-yA/exec';
const TARGET = process.env.BACKEND_TARGET_URL ?? DEFAULT_TARGET;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  // Forward request body and query to the target Apps Script endpoint
  const url = new URL(TARGET);
  const reqUrl = new URL(request.url);
  // forward op query param if present
  if (reqUrl.searchParams.has('op')) {
    url.searchParams.set('op', reqUrl.searchParams.get('op')!);
  }

  // If incoming request has op in JSON body, append as query param too
  let body: any = undefined;
  try {
    body = await request.json();
  } catch (e) {
    // ignore - no json body
  }

  // Make a POST to the Apps Script
  const resp = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  const headers = {
    'Content-Type': resp.headers.get('content-type') ?? 'application/json',
    ...corsHeaders(),
  } as Record<string, string>;

  return new NextResponse(text, { status: resp.status, headers });
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const url = new URL(TARGET);
  // forward query params
  reqUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const resp = await fetch(url.toString(), { method: 'GET' });
  const text = await resp.text();
  const headers = {
    'Content-Type': resp.headers.get('content-type') ?? 'application/json',
    ...corsHeaders(),
  } as Record<string, string>;

  return new NextResponse(text, { status: resp.status, headers });
}

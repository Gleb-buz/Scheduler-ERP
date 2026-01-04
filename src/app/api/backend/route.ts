import { NextResponse } from 'next/server';
import { mockCall } from '@/api/mocks/handlers';

const DEFAULT_TARGET = 'https://script.google.com/macros/s/AKfycbw1rqBmcDNBDCPTPpge5TW33QP2e199lCSOVQDvXsimTnFX7-5aH0bghj6MhLClzUh-yA/exec';
const TARGET = process.env.BACKEND_TARGET_URL ?? DEFAULT_TARGET;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function tryMockFallback(op: string, payload?: Record<string, unknown>) {
  try {
    // `mockCall` returns usable demo data for ops
    const data = await mockCall(op, payload);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'mock_fallback_failed' };
  }
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

  // If Apps Script signals missing Script Property (SPREADSHEET_ID), try returning mock data instead
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.ok === false && typeof parsed.error === 'string' && parsed.error.indexOf('SPREADSHEET_ID') !== -1) {
      // map command -> mock op
      const cmd = body && body.command ? String(body.command) : '';
      const map: Record<string, string> = {
        task_upsert: 'API_WRITE_TASK_UPSERT_BUFFER',
        worklog_append: 'API_WRITE_WORKLOG_BUFFER',
        set_focusdate: 'API_WRITE_FOCUSDATE',
        metric_append: 'API_WRITE_METRIC_BUFFER',
        settings_set: 'API_WRITE_SETTINGS_BUFFER',
      };
      const op = map[cmd] || 'API_WRITE_TASK_UPSERT_BUFFER';
      const fallback = await tryMockFallback(op, body.payload || body || {});
      if (fallback.ok) return new NextResponse(JSON.stringify({ ok: true, requestId: (body && body.payload && (body.payload.request_id || body.payload.requestId)) || '', message: 'mocked' , data: fallback.data }), { status: 200, headers });
      return new NextResponse(JSON.stringify({ ok: false, error: 'mock fallback failed' }), { status: 502, headers });
    }
  } catch (e) {
    // ignore parse errors
  }

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

  // If Apps Script signals missing Script Property (SPREADSHEET_ID), try returning mock data instead
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.ok === false && typeof parsed.error === 'string' && parsed.error.indexOf('SPREADSHEET_ID') !== -1) {
      const action = reqUrl.searchParams.get('action') || '';
      if (action === 'status') {
        const fallback = await tryMockFallback('API_STATUS');
        if (fallback.ok) return new NextResponse(JSON.stringify({ ok: true, status: fallback.data }), { status: 200, headers });
        return new NextResponse(JSON.stringify({ ok: false, error: 'mock fallback failed' }), { status: 502, headers });
      }

      if (action === 'read') {
        const view = reqUrl.searchParams.get('view') || 'API_READ_TODAY_TODAY';
        const payload: Record<string, unknown> = {};
        reqUrl.searchParams.forEach((v, k) => (payload[k] = v));
        const fallback = await tryMockFallback(view, payload);
        if (fallback.ok) return new NextResponse(JSON.stringify({ ok: true, view, meta: { limit: payload.limit || 200, offset: payload.offset || 0, count: Array.isArray(fallback.data) ? fallback.data.length : 0 }, data: fallback.data }), { status: 200, headers });
        return new NextResponse(JSON.stringify({ ok: false, error: 'mock fallback failed' }), { status: 502, headers });
      }
    }
  } catch (e) {
    // ignore
  }

  return new NextResponse(text, { status: resp.status, headers });
}

import { visitorDb, visitDay, daysBefore } from '@/lib/visitor-stats';
export async function POST(request: Request) {
 const headers = { 'Cache-Control': 'no-store' };
 if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return new Response(null, {status:403, headers});
 if (request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1' || /bot|crawler|spider|headless/i.test(request.headers.get('user-agent') || '')) return new Response(null, {status:204, headers});
 if (request.headers.get('content-type') !== 'application/json' || Number(request.headers.get('content-length') || 0) > 200) return new Response(null, {status:400, headers});
 const text = await request.text();
 if (text.length > 200) return new Response(null, {status:413, headers});
 let id: unknown;
 try { id = JSON.parse(text).id; } catch { return new Response(null, {status:400, headers}); }
 if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return new Response(null, {status:400, headers});
 try {
  const db = visitorDb(); const day = visitDay();
  await db.batch([
   db.prepare('INSERT OR IGNORE INTO visitor_days (day, visitor_id) VALUES (?, ?)').bind(day,id),
   db.prepare('DELETE FROM visitor_days WHERE day < ?').bind(daysBefore(day,29))
  ]);
  return new Response(null, {status:204, headers});
 } catch (error) { console.error('Visitor storage unavailable', error instanceof Error ? error.message : 'unknown'); return new Response(null, {status:503, headers}); }
}

import { ensureChannelMetricsTable, type ChannelMetric } from '@/lib/channel-metrics';

export async function GET() {
  const db = await ensureChannelMetricsTable();
  const result = await db.prepare('SELECT canonical_key, subscriber_count, updated_at FROM channel_metrics').all<ChannelMetric>();
  return Response.json(
    { metrics: result.results ?? [] },
    { headers: { 'cache-control': 'public, max-age=300, s-maxage=3600' } },
  );
}

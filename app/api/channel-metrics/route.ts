import { ensureChannelMetricsTable, refreshYoutubeMetrics, type ChannelMetric } from '@/lib/channel-metrics';

export async function GET() {
  const db = await ensureChannelMetricsTable();
  await refreshYoutubeMetrics().catch(() => {});
  const result = await db.prepare('SELECT canonical_key, subscriber_count, updated_at FROM channel_metrics').all<ChannelMetric>();
  return Response.json({ metrics: result.results ?? [] }, { headers: { 'cache-control': 'no-store' } });
}


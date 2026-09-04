import { submissionsDb } from '@/lib/submissions';
import { fetchProfilePage } from '@/lib/profile-metadata';

// Shared atomic lease covers all profiles, submissions and Worker instances.
export async function fetchInstagramPage(url: string): Promise<string> {
  const db = submissionsDb();
  const now = Date.now();
  const lease = await db.prepare(`INSERT INTO instagram_fetch_state (id, next_attempt_at) VALUES ('global', ?)
    ON CONFLICT(id) DO UPDATE SET next_attempt_at = excluded.next_attempt_at
    WHERE instagram_fetch_state.next_attempt_at <= ? RETURNING id`).bind(now + 30_000, now).all();
  if (!lease.results?.length) {
    const state = await db.prepare("SELECT next_attempt_at FROM instagram_fetch_state WHERE id = 'global'").all<{ next_attempt_at: number }>();
    const minutes = Math.max(1, Math.ceil(((state.results?.[0]?.next_attempt_at ?? now) - now) / 60000));
    throw new Error(`Instagram: паўза паміж запытамі. Паўтарыце не раней чым праз ${minutes} хв. Ручное запаўненне даступнае.`);
  }
  try { return await fetchProfilePage(url); }
  catch (error) {
    if (error instanceof Error && /429/.test(error.message)) {
      const next = Math.max(Date.now() + 6 * 60 * 60 * 1000, (error as Error & { retryAt?: number }).retryAt ?? 0);
      await db.prepare("UPDATE instagram_fetch_state SET next_attempt_at = MAX(next_attempt_at, ?) WHERE id = 'global'").bind(next).run();
      throw new Error('Instagram абмежаваў запыты (429). Аўтаматычныя спробы прыпыненыя мінімум на 6 гадзін. Запоўніце картку ўручную; ранейшыя даныя захаваныя.');
    }
    throw error;
  }
}

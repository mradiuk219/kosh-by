import { getChatGPTUser } from '@/app/chatgpt-auth';
import { visitorDb, visitDay, daysBefore } from '@/lib/visitor-stats';
export async function GET() {
 const headers = { 'Cache-Control': 'private, no-store' };
 const user = await getChatGPTUser();
 if (user?.email?.toLowerCase() !== 'radziuk219@gmail.com') return Response.json({error:'Няма доступу'}, {status:403,headers});
 try {
  const day = visitDay();
  const counts = await visitorDb().prepare(`SELECT COUNT(DISTINCT CASE WHEN day = ? THEN visitor_id END) AS today,
   COUNT(DISTINCT CASE WHEN day >= ? THEN visitor_id END) AS week,
   COUNT(DISTINCT visitor_id) AS month FROM visitor_days WHERE day >= ? AND day <= ?`)
   .bind(day,daysBefore(day,6),daysBefore(day,29),day).first();
  return Response.json({counts, day, timezone:'Europe/Minsk'}, {headers});
 } catch { return Response.json({error:'Статыстыка часова недаступная'}, {status:503,headers}); }
}

import { ensureCultureItemsTable,type CultureItem } from '@/lib/culture-items';
export async function GET(){const db=await ensureCultureItemsTable();const x=await db.prepare("SELECT * FROM culture_items WHERE status='published' ORDER BY updated_at DESC").all<CultureItem>();return Response.json({items:x.results??[]})}

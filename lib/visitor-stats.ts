import { env } from 'cloudflare:workers';
export function visitorDb() { return (env as unknown as { DB: D1Database }).DB; }
// Calendar days in Belarus; rolling windows include today.
export function visitDay(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Minsk', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function daysBefore(day: string, count: number) { return new Date(Date.parse(day + 'T12:00:00Z') - count * 86400000).toISOString().slice(0,10); }
export const visitorSchema = `CREATE TABLE visitor_days (day TEXT NOT NULL, visitor_id TEXT NOT NULL, PRIMARY KEY(day, visitor_id));`;

import {
  ensureCatalogOverridesTable,
  type CatalogOverride,
} from '@/lib/catalog-overrides';

export async function GET() {
  const db = await ensureCatalogOverridesTable();
  const result = await db
    .prepare('SELECT * FROM catalog_overrides')
    .all<CatalogOverride>();
  return Response.json(
    { overrides: result.results ?? [] },
    { headers: { 'cache-control': 'no-store' } },
  );
}

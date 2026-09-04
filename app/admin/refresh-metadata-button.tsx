'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
export default function RefreshMetadataButton({ onDone }: { onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function refresh() {
    setBusy(true); setMessage('Абнаўляем метаданыя…');
    let offset: number | null = 0; let checked = 0; let partial = 0; let unavailable = 0;
    try {
      while (offset !== null) {
        const response = await fetch('/api/profile-metadata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ offset }) });
        if (!response.ok) throw new Error('Абнаўленне перарвалася. Ужо атрыманыя даныя захаваныя.');
        const data = await response.json() as { results: { status: string }[]; total: number; next: number | null };
        checked += data.results.length; partial += data.results.filter((r) => r.status === 'partial').length; unavailable += data.results.filter((r) => r.status === 'unavailable').length;
        setMessage(`Праверана ${checked} з ${data.total}. Частковыя даныя: ${partial}; недаступныя: ${unavailable}.`);
        offset = data.next;
      }
      await onDone();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Памылка злучэння'); }
    finally { setBusy(false); }
  }
  return <div className="mb-6 space-y-2"><Button disabled={busy} onClick={() => void refresh()}>{busy ? 'Абнаўляем…' : 'Абнавіць лога і метаданыя ўсіх каналаў'}</Button><p className="text-sm text-white/50">Існыя назвы, апісанні і ручныя лічбы захоўваюцца. Свежыя даныя крыніцы даступныя асобна. Не закрывайце старонку падчас абнаўлення.</p>{message && <p role="status" className="text-sm text-white/70">{message}</p>}</div>;
}

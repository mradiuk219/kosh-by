'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Save, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { parseCategories } from '@/lib/categories';
import { channelIdentity } from '@/lib/channel-identity';
import { media } from '@/app/page';

type Channel = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  category: string | null;
  platform: string | null;
  avatar_url: string | null;
  subscriber_count: number;
};
type CatalogOverride = {
  canonical_key: string;
  description: string;
  category: string;
  deleted: number;
};
type Draft = { description: string; categories: string[]; subscriberCount: number };
const categories = [
  'Агучка',
  'Блог',
  'Гісторыя',
  'Грамадства',
  'Гульні',
  'Гумар',
  'Кнігі',
  'Культура',
  'Мастацтва',
  'Мова',
  'Музыка',
  'Навіны',
  'Навука',
  'Падарожжы',
  'Стрымы',
  'Супольнасць',
  'Творчасць',
  'Тэхналогіі',
];

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/channels', { cache: 'no-store' });
    if (response.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = (await response.json()) as {
      channels?: Channel[];
      overrides?: CatalogOverride[];
      metrics?: { canonical_key: string; subscriber_count: number }[];
    };
    const overrides = new Map(
      (data.overrides ?? []).map((item) => [item.canonical_key, item]),
    );
    const metrics = new Map(
      (data.metrics ?? []).map((item) => [item.canonical_key, item.subscriber_count]),
    );
    const staticChannels = media.flatMap((item) => {
      const key = channelIdentity(item.url);
      if (!key) return [];
      const override = overrides.get(key);
      if (override?.deleted) return [];
      return [
        {
          id: `static:${key}`,
          url: item.url ?? '',
          title: item.title,
          description: override?.description ?? item.creator,
          category: override?.category ?? item.category,
          platform: item.platform,
          avatar_url: item.image ?? null,
          subscriber_count: metrics.get(key) ?? 0,
        } satisfies Channel,
      ];
    });
    const databaseChannels = (data.channels ?? []).map((item) => ({
      ...item,
      subscriber_count: metrics.get(channelIdentity(item.url) ?? '') ?? 0,
    }));
    const next = [...staticChannels, ...databaseChannels].sort((a, b) =>
      (a.title ?? a.url).localeCompare(b.title ?? b.url, 'be'),
    );
    setChannels(next);
    setDrafts(
      Object.fromEntries(
        next.map((item) => [
          item.id,
          {
            description: item.description ?? '',
            categories: [...parseCategories(item.category), '', ''].slice(0, 3),
            subscriberCount: item.subscriber_count,
          },
        ]),
      ),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirtyIds = useMemo(
    () =>
      new Set(
        channels
          .filter(
            (item) =>
              drafts[item.id] &&
              (drafts[item.id].description !== (item.description ?? '') ||
                drafts[item.id].categories.filter(Boolean).join('|') !==
                  parseCategories(item.category).join('|') ||
                drafts[item.id].subscriberCount !== item.subscriber_count),
          )
          .map((item) => item.id),
      ),
    [channels, drafts],
  );
  const filteredChannels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? channels.filter((item) =>
          (item.title ?? '').toLowerCase().includes(needle),
        )
      : channels;
  }, [channels, query]);

  const save = async (id: string) => {
    setBusyId(id);
    setMessage('');
    const draft = drafts[id];
    const response = await fetch('/api/admin/channels', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, ...draft }),
    });
    if (response.ok) {
      setChannels((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                description: draft.description,
                category: draft.categories.filter(Boolean).join('|'),
                subscriber_count: draft.subscriberCount,
              }
            : item,
        ),
      );
      setMessage('Змены захаваныя');
    } else
      setMessage(
        ((await response.json().catch(() => null)) as { error?: string } | null)
          ?.error ?? 'Не ўдалося захаваць змены',
      );
    setBusyId('');
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setMessage('');
    const response = await fetch(
      `/api/admin/channels?id=${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    if (response.ok) {
      setChannels((current) => current.filter((item) => item.id !== id));
      setMessage('Канал выдалены з базы');
    } else
      setMessage(
        ((await response.json().catch(() => null)) as { error?: string } | null)
          ?.error ?? 'Не ўдалося выдаліць канал',
      );
    setBusyId('');
  };

  return (
    <main className="site-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#111821]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 max-w-[1500px] flex-wrap items-center gap-3 px-5 py-3">
          <a
            href="/"
            className="text-2xl font-black tracking-[-0.06em] text-white"
          >
            КОШ<span className="text-primary">.</span>
          </a>
          <span className="text-sm text-white/35">/ Кіраванне каналамі</span>
          <Button
            render={<a href="/admin" />}
            variant="ghost"
            className="ml-auto rounded-full text-white/65"
          >
            <ArrowLeft className="size-4" /> Да заявак
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 py-10">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
            База КОШа
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Каналы ў каталогу
          </h1>
          <p className="mt-2 text-sm text-white/45">
            {channels.length} каналаў з усіх крыніц: створаныя разам з сайтам,
            прапанаваныя карыстальнікамі і знойдзеныя аўтаматычна.
          </p>
        </div>
        <div className="relative mb-5 max-w-xl">
          <Search className="pointer-events-none absolute top-6 left-4 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук аўтара па назве канала"
            aria-label="Пошук аўтара па назве канала"
            className="h-12 rounded-full border-white/10 bg-white/5 pr-4 pl-11 text-white placeholder:text-white/30"
          />
          {query && (
            <p className="mt-2 pl-3 text-xs text-white/35">
              Знойдзена: {filteredChannels.length}
            </p>
          )}
        </div>
        {message && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
          >
            {message}
          </p>
        )}
        {loading ? (
          <p className="text-white/45">Загружаем каналы…</p>
        ) : forbidden ? (
          <div className="rounded-3xl border border-red-300/15 bg-red-300/5 p-8 text-red-200">
            Гэты раздзел даступны толькі ўладальніку КОШа.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            <Table className="min-w-[1360px]">
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="w-20 px-4 text-white/45">
                    Лога
                  </TableHead>
                  <TableHead className="w-56 text-white/45">Назва</TableHead>
                  <TableHead className="min-w-[390px] text-white/45">
                    Апісанне
                  </TableHead>
                  <TableHead className="w-64 text-white/45">
                    Катэгорыі (да 3)
                  </TableHead>
                  <TableHead className="w-28 text-white/45">
                    Платформа
                  </TableHead>
                  <TableHead className="w-36 text-white/45">
                    Падпісанты
                  </TableHead>
                  <TableHead className="w-44 px-4 text-right text-white/45">
                    Дзеянні
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChannels.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-white/8 align-top hover:bg-white/[0.03]"
                  >
                    <TableCell className="px-4 py-4 align-top">
                      {item.avatar_url ? (
                        <img
                          src={item.avatar_url}
                          alt=""
                          className="size-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-full bg-white/8 font-bold text-white/30">
                          {item.title?.slice(0, 1) ?? '?'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 align-top whitespace-normal">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1.5 font-bold text-white hover:text-secondary"
                      >
                        {item.title ?? item.url}
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="py-4 align-top whitespace-normal">
                      <Textarea
                        aria-label={`Апісанне ${item.title ?? ''}`}
                        value={drafts[item.id]?.description ?? ''}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              description: event.target.value,
                            },
                          }))
                        }
                        className="min-h-24 resize-y border-white/10 bg-white/4 text-sm leading-relaxed text-white"
                      />
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="space-y-2">
                        {[0, 1, 2].map((index) => (
                          <NativeSelect
                            key={index}
                            aria-label={`Катэгорыя ${index + 1} для ${item.title ?? ''}`}
                            value={drafts[item.id]?.categories[index] ?? ''}
                            onChange={(event) =>
                              setDrafts((current) => {
                                const values = [
                                  ...(current[item.id]?.categories ?? [
                                    '',
                                    '',
                                    '',
                                  ]),
                                ];
                                values[index] = event.target.value;
                                return {
                                  ...current,
                                  [item.id]: {
                                    ...current[item.id],
                                    categories: values,
                                  },
                                };
                              })
                            }
                            className="w-full text-white"
                          >
                            <NativeSelectOption value="">
                              {index === 0
                                ? 'Выберыце катэгорыю'
                                : 'Не выбрана'}
                            </NativeSelectOption>
                            {categories.map((value) => (
                              <NativeSelectOption
                                key={value}
                                value={value}
                                disabled={drafts[item.id]?.categories.some(
                                  (selected, selectedIndex) =>
                                    selectedIndex !== index &&
                                    selected === value,
                                )}
                              >
                                {value}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top text-white/50">
                      {item.platform ?? '—'}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        aria-label={`Колькасць падпісантаў ${item.title ?? ''}`}
                        value={drafts[item.id]?.subscriberCount ?? 0}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              subscriberCount: Math.max(0, Number(event.target.value) || 0),
                            },
                          }))
                        }
                        className="h-10 border-white/10 bg-white/4"
                      />
                    </TableCell>
                    <TableCell className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Button
                          disabled={
                            !dirtyIds.has(item.id) ||
                            busyId === item.id ||
                            !drafts[item.id]?.categories[0]
                          }
                          onClick={() => save(item.id)}
                          size="sm"
                          className="rounded-full bg-secondary text-white hover:bg-secondary/90"
                        >
                          <Save className="size-3.5" /> Захаваць
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                aria-label={`Выдаліць ${item.title ?? 'канал'}`}
                                disabled={busyId === item.id}
                                size="icon-sm"
                                variant="outline"
                                className="rounded-full border-red-300/20 text-red-200 hover:bg-red-300/10"
                              />
                            }
                          >
                            <Trash2 className="size-4" />
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-white/10 bg-[#202936] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Выдаліць канал?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-white/55">
                                «{item.title ?? item.url}» будзе цалкам выдалены
                                з базы і знікне з каталога. Гэта дзеянне нельга
                                адмяніць.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="border-white/10 bg-white/4">
                              <AlertDialogCancel className="border-white/10 text-white">
                                Скасаваць
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(item.id)}
                                className="bg-red-600 text-white hover:bg-red-500"
                              >
                                Выдаліць
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </main>
  );
}

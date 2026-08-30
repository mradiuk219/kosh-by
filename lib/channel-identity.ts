const platformHosts = [
  ['youtube', ['youtube.com', 'youtu.be']],
  ['instagram', ['instagram.com']],
  ['tiktok', ['tiktok.com']],
  ['twitch', ['twitch.tv']],
] as const;

export const staticChannelIdentities = new Set([
  'youtube:thebudzma', 'youtube:hodnaby', 'youtube:tutejszyszlachcicz', 'youtube:chadanovic',
  'youtube:palatno', 'youtube:rudzi', 'youtube:vozh_voice', 'youtube:konan_v',
  'youtube:vital_chyrvinski', 'youtube:belsat_history', 'youtube:svaboda-historyja', 'youtube:user-sluhaj',
  'instagram:animatarka', 'instagram:brudny_vozhyk', 'instagram:heta.top', 'instagram:belsat',
  'instagram:zahlianie_sonca', 'instagram:nochy_musicband', 'instagram:mojrodnyhuk', 'instagram:paleskaja.emigrantka',
  'instagram:illasiucou', 'instagram:pramovu', 'instagram:kasia_mastak', 'instagram:hodna.by',
  'tiktok:itbeard', 'tiktok:ikbytech', 'tiktok:piersyhikauski', 'tiktok:praz_kosmas',
  'tiktok:rudzi_game', 'tiktok:ms.bahiema', 'tiktok:nadzeyagames', 'tiktok:brudny_vozhyk',
  'tiktok:kaviarnia', 'tiktok:zhuzhal', 'tiktok:gavarun.by', 'tiktok:bastiesmiles',
  'twitch:watafakablr', 'twitch:impani4', 'twitch:dzedmaksim', 'twitch:lepus81',
  'twitch:nine_ravens_cemetery', 'twitch:angryralef', 'twitch:ms_bahiema', 'twitch:toddzie',
  'twitch:shagrael_by', 'twitch:rudzi_belarus', 'twitch:bel_asch', 'twitch:sla5her_by', 'twitch:mihas_gareza',
]);

export function channelIdentity(sourceUrl?: string | null) {
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
    const platform = platformHosts.find(([, hosts]) => hosts.some((name) => host === name || host.endsWith(`.${name}`)))?.[0] ?? host;
    const parts = url.pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part).toLowerCase());
    let account = parts.join('/');
    if (platform === 'youtube' && ['channel', 'c', 'user'].includes(parts[0])) account = `${parts[0]}/${parts[1] ?? ''}`;
    else if (platform === 'youtube' && parts[0]?.startsWith('@')) account = parts[0];
    else if (['instagram', 'tiktok', 'twitch'].includes(platform)) account = parts[0] ?? '';
    account = account.replace(/^@/, '').replace(/\/+$/, '');
    return account ? `${platform}:${account}` : null;
  } catch {
    return null;
  }
}

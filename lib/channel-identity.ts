const platformHosts = [
  ['youtube', ['youtube.com', 'youtu.be']],
  ['instagram', ['instagram.com']],
  ['tiktok', ['tiktok.com']],
  ['twitch', ['twitch.tv']],
] as const;

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

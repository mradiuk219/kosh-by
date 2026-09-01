import 'server-only';
import { headers } from 'next/headers';

export type ChatGPTUser = {
  id: string | null;
  email: string | null;
};

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const id = requestHeaders.get('oai-authenticated-user-id');
  const email = requestHeaders.get('oai-authenticated-user-email');
  return id || email ? { id, email } : null;
}

export function chatGPTSignInPath(returnTo: string) {
  const safeReturnTo =
    returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
  return `/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnTo)}`;
}

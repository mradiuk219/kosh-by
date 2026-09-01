import { AdminAccessGate } from '@/app/admin/access-gate';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import ChannelsClient from '@/app/admin/channels/channels-client';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = 'radziuk219@gmail.com';

export default async function AdminChannelsPage() {
  const user = await getChatGPTUser();
  if (!user) return <AdminAccessGate returnTo="/admin/channels" />;
  if (user.email?.toLowerCase() !== OWNER_EMAIL) {
    return (
      <AdminAccessGate
        returnTo="/admin/channels"
        signedInEmail={user.email}
      />
    );
  }
  return <ChannelsClient />;
}

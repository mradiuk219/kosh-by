import { AdminAccessGate } from '@/app/admin/access-gate';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import AdminClient from '@/app/admin/admin-client';

export const dynamic = 'force-dynamic';

const OWNER_EMAIL = 'radziuk219@gmail.com';

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) return <AdminAccessGate returnTo="/admin" />;
  if (user.email?.toLowerCase() !== OWNER_EMAIL) {
    return (
      <AdminAccessGate returnTo="/admin" signedInEmail={user.email} />
    );
  }
  return <AdminClient />;
}

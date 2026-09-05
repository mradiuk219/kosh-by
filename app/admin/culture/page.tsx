import { AdminAccessGate } from '@/app/admin/access-gate';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import CultureClient from './culture-client';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();if(!user)return <AdminAccessGate returnTo="/admin/culture"/>;if(user.email?.toLowerCase()!=='radziuk219@gmail.com')return <AdminAccessGate returnTo="/admin/culture" signedInEmail={user.email}/>;return <CultureClient/>}

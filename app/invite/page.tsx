import { currentUser } from '@/lib/auth';
import Invite from './invite-client';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const token = (await searchParams).token ?? '';
    const user = await currentUser();
    return <main className="auth-page"><section className="auth-panel"><Invite token={token} signedIn={Boolean(user)} /></section></main>;
}

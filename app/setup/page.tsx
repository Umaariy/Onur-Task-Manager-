import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/server';
import { env } from '@/lib/platform';
import AuthForm from '../auth-form';
export const dynamic = 'force-dynamic';
export default async function Setup() {
    if (await currentUser()) redirect('/');
    const row = await db().prepare('SELECT COUNT(*) AS count FROM accounts').first<{ count: number }>();
    if (row?.count) redirect('/login');
    void env.OTM_SETUP_SECRET; // creates data/setup-key.txt for the Owner to read
    return <AuthForm mode="setup" next="/" />;
}

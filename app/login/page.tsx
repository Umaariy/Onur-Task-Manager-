import { redirect } from 'next/navigation';
import { currentUser, safeNext } from '@/lib/auth';
import AuthForm from '../auth-form';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
    const params = await searchParams;
    const next = safeNext(params.next);
    if (await currentUser()) redirect(next);
    return <AuthForm mode="login" next={next} initialEmail={typeof params.email === 'string' ? params.email.slice(0, 254) : ''} />;
}

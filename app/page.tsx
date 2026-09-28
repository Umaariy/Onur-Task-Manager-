import KanbanApp from './kanban-app';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/server';
export const dynamic = 'force-dynamic';
export default async function Home() {
    const user = await currentUser();
    if (!user) {
        const row = await db().prepare('SELECT COUNT(*) AS count FROM accounts').first<{ count: number }>();
        redirect(row?.count ? '/login' : '/setup');
    }
    return <KanbanApp />;
}

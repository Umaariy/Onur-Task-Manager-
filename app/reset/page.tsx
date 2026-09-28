import ResetForm from './reset-form';
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const token = (await searchParams).token ?? '';
    return <main className="auth-page"><section className="auth-panel"><ResetForm token={token}/></section></main>;
}

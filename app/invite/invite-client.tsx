'use client';
import { FormEvent, useState } from 'react';
import { useAuthLocale } from '../use-auth-locale';
import { AuthNotice, LanguageMenu, PasswordField } from '../auth-controls';
import { authErrorMessage } from '@/lib/auth-error';

export default function Invite({ token, signedIn }: { token: string; signedIn: boolean }) {
    const { locale, change, t } = useAuthLocale();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const returnTo = '/invite?token=' + encodeURIComponent(token);
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!token) { setError('Havola noto‘g‘ri'); return; }
        if (!signedIn && password.length < 8) { setError('Parol kamida 8 belgidan iborat bo‘lsin'); return; }
        if (!signedIn && password !== confirm) { setError('Parollar bir xil emas'); return; }
        setBusy(true); setError('');
        try {
            const res = await fetch('/api/v1/invites/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
            const data: any = await res.json();
            if (!res.ok) throw Error(authErrorMessage(data.code, 'Taklifni qabul qilib bo‘lmadi'));
            location.href = '/?workspace=' + encodeURIComponent(data.workspaceId);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Taklifni qabul qilib bo‘lmadi'); }
        finally { setBusy(false); }
    }
    return <><LanguageMenu locale={locale} onChange={change} t={t} /><div className="eyebrow">{t('JAMOAGA TAKLIF')}</div><h1>{t('Birga ishlashni boshlang')}</h1><p className="muted">{t(signedIn ? 'Joriy hisobingiz bilan ish maydoniga qo‘shiling.' : 'Birinchi marta kirayotgan bo‘lsangiz, o‘z parolingizni o‘rnating.')}</p>
        <form onSubmit={submit} noValidate>
            {!signedIn && <><PasswordField label={t('Parol')} value={password} onChange={setPassword} autoComplete="new-password" t={t} /><PasswordField label={t('Parolni takrorlang')} value={confirm} onChange={setConfirm} autoComplete="new-password" t={t} /></>}
            <AuthNotice message={t(error)} />
            <button className="button" disabled={busy || !token}>{t(busy ? 'Qo‘shilmoqda…' : 'Taklifni qabul qilish')}</button>
        </form>
        {!signedIn && <p className="auth-help">{t('Hisobingiz allaqachon bormi?')} <a href={'/login?next=' + encodeURIComponent(returnTo)}>{t('Avval hisobga kiring')}</a>.</p>}
    </>;
}

'use client';
import { FormEvent, useState } from 'react';
import { useAuthLocale } from '../use-auth-locale';
import { AuthNotice, LanguageMenu, PasswordField } from '../auth-controls';
import { authErrorMessage } from '@/lib/auth-error';
export default function ResetForm({ token }: { token: string }) {
    const { locale, change, t } = useAuthLocale();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!token) { setError('Havola noto‘g‘ri'); return; }
        if (password.length < 8) { setError('Parol kamida 8 belgidan iborat bo‘lsin'); return; }
        if (password !== confirm) { setError('Parollar bir xil emas'); return; }
        setBusy(true); setError('');
        try {
            const result = await fetch('/api/v1/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
            const data: any = await result.json();
            if (!result.ok) throw Error(authErrorMessage(data.code, 'Parolni almashtirib bo‘lmadi'));
            location.href = '/login';
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Parolni almashtirib bo‘lmadi'); }
        finally { setBusy(false); }
    }
    return <><LanguageMenu locale={locale} onChange={change} t={t} /><div className="eyebrow">ONUR TASK MANAGER</div><h1>{t('Yangi parol o‘rnating')}</h1><form onSubmit={submit} noValidate><PasswordField label={t('Yangi parol')} value={password} onChange={setPassword} autoComplete="new-password" t={t} /><PasswordField label={t('Parolni takrorlang')} value={confirm} onChange={setConfirm} autoComplete="new-password" t={t} /><AuthNotice message={t(error)} /><button className="button" disabled={busy || !token}>{t(busy ? 'Saqlanmoqda…' : 'Parolni saqlash')}</button></form></>;
}

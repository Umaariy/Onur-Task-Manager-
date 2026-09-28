'use client';
import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useAuthLocale } from './use-auth-locale';
import { AuthNotice, LanguageMenu, PasswordField } from './auth-controls';
import { authErrorMessage } from '@/lib/auth-error';

export default function AuthForm({ mode, next, initialEmail = '' }: { mode: 'login' | 'setup'; next: string; initialEmail?: string }) {
    const { locale, change, t } = useAuthLocale();
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [setupSecret, setSetupSecret] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Email noto‘g‘ri'); return; }
        if (!password) { setError('Parolni kiriting'); return; }
        if (mode === 'setup' && password.length < 8) { setError('Parol kamida 8 belgidan iborat bo‘lsin'); return; }
        if (mode === 'setup' && password !== confirm) { setError('Parollar bir xil emas'); return; }
        if (mode === 'setup' && !setupSecret.trim()) { setError('Boshlang‘ich sozlash kalitini kiriting'); return; }
        setBusy(true); setError('');
        try {
            const route = mode === 'setup' ? 'setup' : 'login';
            const res = await fetch('/api/v1/auth/' + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, setupSecret }) });
            const data: any = await res.json();
            if (!res.ok) throw Error(authErrorMessage(data.code, 'Kirish amalga oshmadi'));
            location.href = next;
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kirish amalga oshmadi'); }
        finally { setBusy(false); }
    }
    return <main className="auth-page"><section className="auth-panel">
        <div className="auth-logo"><Image src="/onur-mark.png" alt="ONUR" width={48} height={48}/><div><strong>ONUR</strong><span>Task Manager</span></div></div>
        <LanguageMenu locale={locale} onChange={change} t={t} />
        <div className="eyebrow">{t(mode === 'setup' ? 'BIRINCHI SOZLASH' : 'HISOBGA KIRISH')}</div>
        <h1>{t(mode === 'setup' ? 'Owner hisobini yarating' : 'Xush kelibsiz')}</h1>
        <p className="muted">{t(mode === 'setup' ? 'Mavjud ish maydoni va vazifalar saqlanadi. Parolni faqat o‘zingiz bilasiz.' : 'Admin ruxsat bergan email va parolingizni kiriting.')}</p>
        <form onSubmit={submit} noValidate>
            <label>{t('Email')}<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} /></label>
            <PasswordField label={t('Parol')} value={password} onChange={setPassword} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} t={t} />
            {mode === 'setup' && <>
                <PasswordField label={t('Parolni takrorlang')} value={confirm} onChange={setConfirm} autoComplete="new-password" t={t} />
                <label>{t('Boshlang‘ich sozlash kaliti')}<input type="text" autoComplete="off" spellCheck={false} value={setupSecret} onChange={event => setSetupSecret(event.target.value)} /></label>
                <p className="auth-field-help">{t('Bu parolni eslash uchun so‘z emas. Birinchi Owner hisobiga ruxsat beruvchi kalitni loyiha papkasidagi .dev.vars faylidan oling.')}</p>
            </>}
            <AuthNotice message={t(error)} />
            <button className="button" disabled={busy}>{t(busy ? 'Kuting…' : mode === 'setup' ? 'Owner hisobini yaratish' : 'Kirish')}</button>
        </form>
        {mode === 'login' && <p className="auth-help">{t('Hisobingiz yo‘qmi? Administratoringizdan taklif havolasini oling.')}</p>}
    </section></main>;
}

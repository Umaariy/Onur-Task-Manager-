'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { languageOptions, Locale } from '@/lib/i18n';

type Translator = (message: string) => string;

export function LanguageMenu({ locale, onChange, t, compact = false }: { locale: Locale; onChange: (locale: Locale) => void; t: Translator; compact?: boolean }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [open]);
    const selected = languageOptions.find(option => option.value === locale) ?? languageOptions[0];
    return <div className={'language-menu' + (compact ? ' compact' : '')} ref={root} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
        <button type="button" className="language-trigger" aria-label={t('Platforma tili')} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span>{compact ? selected.short : selected.label}</span><ChevronDown size={16} aria-hidden="true" />
        </button>
        {open && <div className="language-options" role="listbox" aria-label={t('Platforma tili')}>
            {languageOptions.map(option => <button type="button" role="option" aria-selected={option.value === locale} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
                <span>{option.label}</span>{option.value === locale && <Check size={16} aria-hidden="true" />}
            </button>)}
        </div>}
    </div>;
}

export function PasswordField({ label, value, onChange, autoComplete, t }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; t: Translator }) {
    const [visible, setVisible] = useState(false);
    return <label>{label}<span className="auth-password-wrap">
        <input type={visible ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={event => onChange(event.target.value)} />
        <button type="button" className="auth-password-toggle" aria-label={t(visible ? 'Parolni yashirish' : 'Parolni ko‘rsatish')} aria-pressed={visible} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
    </span></label>;
}

export function AuthNotice({ message }: { message: string }) {
    if (!message) return null;
    return <div className="auth-notice" role="alert"><AlertCircle size={19} aria-hidden="true"/><span>{message}</span></div>;
}

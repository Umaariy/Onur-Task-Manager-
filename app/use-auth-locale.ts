'use client';
import { useEffect, useState } from 'react';
import { languageOptions, Locale, translate } from '@/lib/i18n';

export function useAuthLocale() {
    const [locale, setLocale] = useState<Locale>('uz-Latn');
    useEffect(() => {
        const saved = localStorage.getItem('onur-locale');
        if (languageOptions.some(option => option.value === saved)) setLocale(saved as Locale);
    }, []);
    function change(value: Locale) { setLocale(value); localStorage.setItem('onur-locale', value); document.documentElement.lang = value; }
    return { locale, change, t: (source: string) => translate(source, locale) };
}

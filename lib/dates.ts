export const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
import type { Locale } from './i18n';
const dateLocale = (locale: Locale) => locale === 'ru' ? 'ru-RU' : 'uz-Cyrl-UZ';
export function shortDate(value: string, locale: Locale = 'uz-Latn') { const d = new Date(value + 'T12:00:00'); return locale === 'uz-Latn' ? d.getDate() + ' ' + months[d.getMonth()].slice(0, 3) : new Intl.DateTimeFormat(dateLocale(locale), { day: 'numeric', month: 'short' }).format(d); }
export function fullDate(d: Date, locale: Locale = 'uz-Latn') { return locale === 'uz-Latn' ? d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() : new Intl.DateTimeFormat(dateLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' }).format(d); }
export function monthTitle(d: Date, locale: Locale = 'uz-Latn') { return locale === 'uz-Latn' ? months[d.getMonth()] + ' ' + d.getFullYear() : new Intl.DateTimeFormat(dateLocale(locale), { month: 'long', year: 'numeric' }).format(d); }

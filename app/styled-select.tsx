'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

export default function StyledSelect({ value, options, onChange, disabled = false, ariaLabel, className = '' }: {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
    ariaLabel: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const menu = useRef<HTMLDivElement>(null);
    const chosen = options.find(option => option.value === value);
    const toggle = () => {
        if (open) { setOpen(false); return; }
        const rect = trigger.current?.getBoundingClientRect();
        if (!rect) return;
        const menuHeight = Math.min(options.length * 39 + 12, 220);
        const modal = root.current?.closest('.modal')?.getBoundingClientRect();
        const bottom = Math.min(window.innerHeight, modal?.bottom ?? window.innerHeight);
        const top = Math.max(0, modal?.top ?? 0);
        const above = bottom - rect.bottom < menuHeight + 12 && rect.top - top > menuHeight + 12;
        setPosition({
            top: above ? rect.top - menuHeight - 6 : rect.bottom + 6,
            left: Math.min(rect.left, Math.max(8, window.innerWidth - Math.max(rect.width, 170) - 8)),
            width: Math.max(rect.width, 170),
        });
        setOpen(true);
    };
    useEffect(() => {
        if (!open) return;
        const outside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
        };
        const onScroll = (event: Event) => {
            if (menu.current?.contains(event.target as Node)) return;
            const rect = trigger.current?.getBoundingClientRect();
            if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) { setOpen(false); return; }
            const menuHeight = Math.min(options.length * 39 + 12, 220);
            const modal = root.current?.closest('.modal')?.getBoundingClientRect();
            const bottom = Math.min(window.innerHeight, modal?.bottom ?? window.innerHeight);
            const top = Math.max(0, modal?.top ?? 0);
            const above = bottom - rect.bottom < menuHeight + 12 && rect.top - top > menuHeight + 12;
            setPosition({
                top: above ? rect.top - menuHeight - 6 : rect.bottom + 6,
                left: Math.min(rect.left, Math.max(8, window.innerWidth - Math.max(rect.width, 170) - 8)),
                width: Math.max(rect.width, 170),
            });
        };
        const onResize = () => setOpen(false);
        document.addEventListener('pointerdown', outside);
        document.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            document.removeEventListener('pointerdown', outside);
            document.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open]);
    useEffect(() => {
        if (!open) return;
        const index = Math.max(0, options.findIndex(option => option.value === value));
        menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[index]?.focus();
    }, [open]);
    const onEscape = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    };
    return <div className={'styled-select ' + className} ref={root} onKeyDown={onEscape}>
        <button ref={trigger} type="button" className="styled-select-trigger" disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={toggle} onKeyDown={event => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) { event.preventDefault(); toggle(); }
        }}><span>{chosen?.label ?? options[0]?.label ?? '—'}</span><ChevronDown size={16} aria-hidden="true"/></button>
        {open && createPortal(<div ref={menu} className={'styled-select-menu' + (root.current?.closest('.dark') ? ' dark' : '')} style={position} role="listbox" aria-label={ariaLabel} onKeyDown={onEscape}>
            {options.map((option, index) => <button key={option.value + ':' + index} type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }} onKeyDown={event => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                    menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[next]?.focus();
                }
            }}><span>{option.label}</span>{option.value === value && <Check size={15} aria-hidden="true"/>}</button>)}
        </div>, document.body)}
    </div>;
}

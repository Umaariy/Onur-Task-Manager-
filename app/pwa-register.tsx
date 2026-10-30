'use client';
import { useEffect } from 'react';

/** Registers the service worker in production so the platform can be installed as an app. */
export default function PwaRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => { });
    }, []);
    return null;
}

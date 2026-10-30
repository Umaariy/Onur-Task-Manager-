import type { MetadataRoute } from 'next';

// Lets phones, tablets and desktops install the platform as an app ("Add to Home Screen").
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'ONUR Task Manager',
        short_name: 'ONUR Tasks',
        description: 'Jamoa loyihalari va vazifalarini boshqarish maydoni.',
        lang: 'uz',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#EEEBE2',
        theme_color: '#EEEBE2',
        categories: ['productivity', 'business'],
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
            { name: 'Mening vazifalarim', short_name: 'Vazifalarim', url: '/?view=mine', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
    };
}

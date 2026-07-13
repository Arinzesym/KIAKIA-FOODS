import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KiaKia Foods OMS',
    short_name: 'KiaKia OMS',
    description: 'Mobile-first operations management for KiaKia Foods runners, riders, and admin teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6fbf4',
    theme_color: '#2f9956',
    orientation: 'portrait',
    lang: 'en-NG',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.svg',
        type: 'image/svg+xml',
        sizes: '192x192',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512.svg',
        type: 'image/svg+xml',
        sizes: '512x512',
        purpose: 'maskable'
      }
    ]
  };
}

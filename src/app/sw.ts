import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

// ============================================================
// BeautyNote — Service Worker (Serwist)
// ============================================================
// Stratégies :
//   - NetworkFirst : pages dynamiques (calendrier, clients, etc.)
//   - defaultCache : stratégies par défaut de Serwist/Next.js
//   - Offline fallback : /offline si réseau indisponible
// ============================================================

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Forcer NetworkFirst pour TOUTES les pages dynamiques (HTML)
    // Cela évite que le SW serve des pages en cache avec des données périmées
    {
      matcher: ({ request, url }) =>
        request.destination === "document" && url.pathname !== "/offline",
      handler: new NetworkFirst(),
    },
    // Garder les stratégies par défaut pour les assets (JS, CSS, images)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

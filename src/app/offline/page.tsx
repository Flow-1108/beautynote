'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-prune">Hors ligne</h1>
        <p className="mt-2 text-sm text-foreground">
          Vous êtes actuellement hors ligne. Vérifiez votre connexion internet
          et réessayez.
        </p>
        <p className="mt-4 text-xs text-secondary">
          Les opérations critiques (paiements, création de RDV) ne sont pas
          disponibles hors connexion.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

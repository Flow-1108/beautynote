'use client';

import Image from 'next/image';
import { loginAction } from '@/actions/auth';
import { useActionState } from 'react';

const initialState = { error: '' };

function loginFormAction(
  _prevState: { error: string },
  formData: FormData,
) {
  return loginAction(formData) as Promise<{ error: string }>;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginFormAction,
    initialState,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Image
              src="/navbar-logo.png"
              alt="Beauty Note"
              width={120}
              height={120}
              className="rounded-full"
              priority
            />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-prune">
            Beauty Note
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Connectez-vous pour accéder au salon
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-prune"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-secondary focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-prune"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-secondary focus:border-prune focus:outline-none focus:ring-1 focus:ring-prune"
              placeholder="••••••••"
            />
          </div>

          {/* Error message */}
          {state.error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-prune px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-prune-light focus:outline-none focus:ring-2 focus:ring-prune focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { logoutAction } from '@/actions/auth';
import { LayoutDashboard, Users, Sparkles, CalendarDays, CreditCard, Clock, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/services', label: 'Services', icon: Sparkles },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { href: '/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/horaires', label: 'Horaires', icon: Clock },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden rounded-md p-2 text-white/80 hover:bg-prune-light hover:text-white"
        aria-label="Menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed right-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 bg-prune shadow-xl md:hidden">
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <nav className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-white/80 transition-colors hover:bg-prune-light hover:text-white"
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout button */}
              <div className="mt-auto border-t border-prune-light pt-4">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-white/60 transition-colors hover:bg-prune-light hover:text-white"
                  >
                    <X className="h-5 w-5" />
                    Déconnexion
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

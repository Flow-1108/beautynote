import Link from 'next/link';
import Image from 'next/image';
import { logoutAction } from '@/actions/auth';
import { LayoutDashboard, Users, Sparkles, CalendarDays, CreditCard, Clock } from 'lucide-react';
import { MobileNav } from './mobile-nav';

const navLinks = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/services', label: 'Services', icon: Sparkles },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { href: '/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/horaires', label: 'Horaires', icon: Clock },
];

export function Navbar() {
  return (
    <nav className="border-b border-border bg-prune">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <Image
            src="/navbar-logo.png"
            alt="BeautyNote"
            width={40}
            height={40}
            className="rounded-full"
            priority
          />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            BeautyNote
          </span>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-prune-light hover:text-white"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Logout - Hidden on mobile */}
        <div className="hidden md:block">
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-prune-light hover:text-white"
            >
              Déconnexion
            </button>
          </form>
        </div>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </nav>
  );
}

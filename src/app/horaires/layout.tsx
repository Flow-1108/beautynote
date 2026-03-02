import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function HorairesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function PaiementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

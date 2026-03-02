import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

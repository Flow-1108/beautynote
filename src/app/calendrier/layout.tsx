import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function CalendrierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

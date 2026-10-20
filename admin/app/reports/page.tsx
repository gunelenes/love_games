import { AdminShell } from '@/components/admin-shell';
import { ReportsViewer } from '@/components/reports-viewer';

export default function ReportsPage() {
  return (
    <AdminShell>
      <ReportsViewer />
    </AdminShell>
  );
}

import { AdminShell } from '@/components/admin-shell';
import { SubmissionsViewer } from '@/components/submissions-viewer';

export default function FantasiesPage() {
  return (
    <AdminShell>
      <SubmissionsViewer
        collectionName="fantasies"
        title="Fanteziler"
        description="Kullanıcıların önerdiği fantezi senaryoları ve temaları. İçerik seçiminde ilham kaynağı."
      />
    </AdminShell>
  );
}

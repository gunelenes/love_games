import { AdminShell } from '@/components/admin-shell';
import { SubmissionsViewer } from '@/components/submissions-viewer';

export default function SuggestionsPage() {
  return (
    <AdminShell>
      <SubmissionsViewer
        collectionName="suggestions"
        title="Öneriler"
        description="Kullanıcıların uygulama hakkında gönderdiği öneriler ve geri bildirimler."
      />
    </AdminShell>
  );
}

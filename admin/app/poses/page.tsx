import { AdminShell } from '@/components/admin-shell';
import { ArtEditor } from '@/components/art-editor';

export default function PosesPage() {
  return (
    <AdminShell>
      <ArtEditor
        deck="poses"
        title="Pozlar"
        description="Pozlar destesindeki karakalem kartlar. Görseller Firebase Storage'a yüklenir, metinler Firestore'da tutulur."
        newLabel="+ Yeni Poz"
      />
    </AdminShell>
  );
}

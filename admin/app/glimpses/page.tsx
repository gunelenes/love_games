import { AdminShell } from '@/components/admin-shell';
import { ArtEditor } from '@/components/art-editor';

export default function GlimpsesPage() {
  return (
    <AdminShell>
      <ArtEditor
        deck="glimpses"
        title="Göz Ucuyla"
        description="Yarım/kışkırtıcı karakalem + hayal gücü prompt'u. Görseller Firebase Storage'a yüklenir, metinler Firestore'da tutulur."
        newLabel="+ Yeni Kart"
      />
    </AdminShell>
  );
}

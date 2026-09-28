import { AdminShell } from '@/components/admin-shell';
import { CategoryEditor } from '@/components/category-editor';

export default function DiceFacesPage() {
  return (
    <AdminShell>
      <CategoryEditor
        collectionName="diceFaces"
        title="Dice Faces"
        description="Zar oyunundaki couple aksiyon zarının 6 yüzü."
      />
    </AdminShell>
  );
}

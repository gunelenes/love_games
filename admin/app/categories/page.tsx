import { AdminShell } from '@/components/admin-shell';
import { CategoryEditor } from '@/components/category-editor';

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoryEditor
        collectionName="categories"
        title="Categories"
        description="Çark oyununda gösterilen kategoriler ve içindeki prompt'lar."
      />
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BEST_SELLER_SLUG, type Category } from "../types";
import CategoryDeleteAlert from "./CategoryDeleteAlert";
import CategoryFormDialog from "./CategoryFormDialog";

export default function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/products/categories", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; categories: Category[] };
    if (!response.ok) throw new Error(data.error || "Kategori gagal dimuat.");
    setCategories(data.categories);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Kategori gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Tambah kategori
          </Button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat kategori…</p>
        ) : categories.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada kategori.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {category.slug === BEST_SELLER_SLUG && (
                        <Star className="size-4 text-accent-foreground" />
                      )}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell>{category.position}</TableCell>
                  <TableCell>
                    {category.isSystem && <Badge variant="secondary">Sistem</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {!category.isSystem && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => {
                            setEditingCategory(category);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Hapus"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        nextPosition={categories.length}
        onSaved={refresh}
      />
      <CategoryDeleteAlert
        category={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </Card>
  );
}

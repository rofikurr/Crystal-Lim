"use client";

import { Eye, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BEST_SELLER_SLUG, isBestSeller, money, type Product } from "./types";

export default function ProductsTable({
  products,
  canManageProducts,
  busy,
  onDetail,
  onEdit,
  onDelete,
  onToggleBest,
}: {
  products: Product[];
  canManageProducts: boolean;
  busy: boolean;
  onDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleBest: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Belum ada produk di tampilan ini.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produk</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead>Harga</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const best = isBestSeller(product);
          const otherCategories = product.categories.filter((c) => c.slug !== BEST_SELLER_SLUG);
          return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt=""
                    className="size-11 shrink-0 rounded-md border border-border object-cover"
                  />
                  <span className="font-medium">{product.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {otherCategories.length > 0
                  ? otherCategories.map((c) => c.name).join(", ")
                  : "—"}
              </TableCell>
              <TableCell>{money.format(product.price)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {best && <Badge>Best seller</Badge>}
                  <Badge variant={product.published ? "secondary" : "outline"}>
                    {product.published ? "Tampil" : "Disembunyikan"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Lihat detail"
                    onClick={() => onDetail(product)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  {canManageProducts && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title={best ? "Lepas best seller" : "Jadikan best seller"}
                        disabled={busy}
                        onClick={() => onToggleBest(product)}
                      >
                        {best ? <StarOff className="size-4" /> : <Star className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Edit"
                        onClick={() => onEdit(product)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Hapus"
                        disabled={busy}
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(product)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

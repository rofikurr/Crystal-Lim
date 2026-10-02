"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { money, type Product } from "./types";

export default function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {product && (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>{money.format(product.price)}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {product.bestSeller && <Badge>Best seller</Badge>}
                <Badge variant={product.published ? "secondary" : "outline"}>
                  {product.published ? "Tampil di toko" : "Disembunyikan"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(product.images.length > 0 ? product.images : [product.image]).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt={product.name}
                    className="aspect-square w-full rounded-md border border-border object-cover"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">Deskripsi</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {product.description || "Tidak ada deskripsi."}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Kategori</dt>
                  <dd className="font-medium">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Urutan tampil</dt>
                  <dd className="font-medium">{product.position}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Dibuat</dt>
                  <dd className="font-medium">{product.createdAt}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Diubah</dt>
                  <dd className="font-medium">{product.updatedAt}</dd>
                </div>
              </dl>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Lihat link produk asli ↗
                </a>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

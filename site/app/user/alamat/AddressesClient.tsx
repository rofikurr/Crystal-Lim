"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AddressDeleteAlert from "./AddressDeleteAlert";
import AddressFormDialog from "./AddressFormDialog";
import type { Address } from "./types";
import { useTranslation } from "@/lib/i18n/context";

export default function AddressesClient() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);

  async function refresh() {
    const response = await fetch("/api/user/addresses", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; addresses: Address[] };
    if (!response.ok) throw new Error(data.error || t("address.loadFailed"));
    setAddresses(data.addresses);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : t("address.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> {t("address.add")}
          </Button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("address.loading")}</p>
        ) : addresses.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("address.empty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{address.label}</p>
                    {address.isDefault && (
                      <Badge variant="secondary">
                        <Star className="size-3" /> {t("address.default")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.recipientName} · {address.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.address}, {address.village}, {address.district}, {address.city},{" "}
                    {address.province} {address.postal}
                  </p>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={t("common.edit")}
                    onClick={() => {
                      setEditing(address);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title={t("common.delete")}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(address)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddressFormDialog open={formOpen} onOpenChange={setFormOpen} address={editing} onSaved={refresh} />
      <AddressDeleteAlert
        address={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </Card>
  );
}

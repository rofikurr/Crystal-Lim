"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  endpoint,
  successMessage,
  errorFallback,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** URL DELETE; null kalau belum ada target terpilih (dialog tetap bisa dirender tertutup). */
  endpoint: string | null;
  successMessage: string;
  errorFallback: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    if (!endpoint) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || errorFallback);
      toast.success(successMessage);
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorFallback);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              confirmDelete();
            }}
          >
            {busy ? "Menghapus…" : "Ya, hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

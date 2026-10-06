"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Broadcast = {
  id: number;
  subject: string;
  body: string;
  recipientCount: number;
  failedCount: number;
  createdAt: string;
};

export default function BroadcastClient() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const response = await fetch("/api/admin/broadcasts", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; broadcasts: Broadcast[] };
    if (!response.ok) throw new Error(data.error || "Riwayat gagal dimuat.");
    setHistory(data.broadcasts);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Riwayat gagal dimuat."))
      .finally(() => setLoading(false));
  }, []);

  async function send() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = (await response.json()) as {
        error?: string;
        recipientCount?: number;
        failedCount?: number;
      };
      if (!response.ok) throw new Error(data.error || "Broadcast gagal dikirim.");
      const { recipientCount = 0, failedCount = 0 } = data;
      if (failedCount === 0) {
        toast.success(`Broadcast terkirim ke ${recipientCount} pelanggan.`);
      } else if (failedCount < recipientCount) {
        toast.warning(`Terkirim ke ${recipientCount - failedCount} dari ${recipientCount} pelanggan.`);
      } else {
        toast.error("Broadcast gagal terkirim ke semua pelanggan.");
      }
      setSubject("");
      setBody("");
      setConfirmOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Broadcast gagal dikirim.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-subject">Subjek email</Label>
            <Input
              id="broadcast-subject"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Mis. Koleksi baru bulan ini!"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-body">Isi pesan</Label>
            <Textarea
              id="broadcast-body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis isi broadcast di sini. Satu baris kosong memisahkan paragraf."
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!subject.trim() || !body.trim()} onClick={() => setConfirmOpen(true)}>
              Kirim sekarang
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">Riwayat broadcast</h2>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Memuat riwayat…</p>
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Belum ada broadcast terkirim.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Terkirim</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const success = item.recipientCount - item.failedCount;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.subject}</TableCell>
                      <TableCell>
                        <Badge variant={item.failedCount === 0 ? "secondary" : "destructive"}>
                          {success} / {item.recipientCount} berhasil
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.createdAt}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim broadcast ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Email akan langsung terkirim ke semua pelanggan yang berlangganan newsletter. Tindakan
              ini tidak bisa dibatalkan setelah dikirim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                send();
              }}
            >
              {busy ? "Mengirim…" : "Ya, kirim sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

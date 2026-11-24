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
import { useTranslation } from "@/lib/i18n/context";

type Broadcast = {
  id: number;
  subject: string;
  body: string;
  recipientCount: number;
  failedCount: number;
  createdAt: string;
};

export default function BroadcastClient() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const response = await fetch("/api/admin/broadcasts", { cache: "no-store" });
    const data = (await response.json()) as { error?: string; broadcasts: Broadcast[] };
    if (!response.ok) throw new Error(data.error || t("broadcast.loadFailed"));
    setHistory(data.broadcasts);
  }

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(error instanceof Error ? error.message : t("broadcast.loadFailed")))
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
      if (!response.ok) throw new Error(data.error || t("broadcast.sendFailed"));
      const { recipientCount = 0, failedCount = 0 } = data;
      if (failedCount === 0) {
        toast.success(t("broadcast.sentTo", { count: recipientCount }));
      } else if (failedCount < recipientCount) {
        toast.warning(t("broadcast.partialSent", { sent: recipientCount - failedCount, total: recipientCount }));
      } else {
        toast.error(t("broadcast.allFailed"));
      }
      setSubject("");
      setBody("");
      setConfirmOpen(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("broadcast.sendFailed"));
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
            <Label htmlFor="broadcast-subject">{t("broadcast.subject")}</Label>
            <Input
              id="broadcast-subject"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("broadcast.subjectPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-body">{t("broadcast.body")}</Label>
            <Textarea
              id="broadcast-body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("broadcast.bodyPlaceholder")}
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!subject.trim() || !body.trim()} onClick={() => setConfirmOpen(true)}>
              {t("broadcast.sendNow")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">{t("broadcast.history")}</h2>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("broadcast.loadingHistory")}</p>
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("broadcast.noHistory")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("broadcast.table.subject")}</TableHead>
                  <TableHead>{t("broadcast.table.sent")}</TableHead>
                  <TableHead>{t("broadcast.table.date")}</TableHead>
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
                          {t("broadcast.table.successRatio", { success, total: item.recipientCount })}
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
            <AlertDialogTitle>{t("broadcast.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("broadcast.confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                send();
              }}
            >
              {busy ? t("broadcast.confirm.sending") : t("broadcast.confirm.sendNow")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

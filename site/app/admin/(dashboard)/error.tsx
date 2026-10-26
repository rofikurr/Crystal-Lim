"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <h1 className="text-xl font-bold">{t("admin.pageLoadError")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.pageLoadErrorBody")}
          </p>
          <Button onClick={() => reset()}>{t("admin.retry")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

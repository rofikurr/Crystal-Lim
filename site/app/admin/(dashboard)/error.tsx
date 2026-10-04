"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <h1 className="text-xl font-bold">Halaman gagal dimuat</h1>
          <p className="text-sm text-muted-foreground">
            Terjadi gangguan sementara saat memuat data. Coba lagi beberapa saat lagi.
          </p>
          <Button onClick={() => reset()}>Coba lagi</Button>
        </CardContent>
      </Card>
    </div>
  );
}

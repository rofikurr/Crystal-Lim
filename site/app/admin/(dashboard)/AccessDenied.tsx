import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";

export default function AccessDenied({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <ShieldAlert className="size-10 text-destructive" />
          <h1 className="text-xl font-bold">{t("admin.accessDenied")}</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

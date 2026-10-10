import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isBucketKey, signReportUrl } from "@/lib/farmers";

// PDF / text download buttons for a trigger report in the private gona-files bucket.
// Each click asks the server for a short-lived signed link (storage row-level security
// decides who may have it).
export function ReportButtons({ pdfPath, txtPath }: { pdfPath: string; txtPath: string | null }) {
  const sign = useServerFn(signReportUrl);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function open(path: string) {
    setBusy(path);
    setError(null);
    // Open the tab during the click (popup blockers allow that), then point it at the
    // short-lived signed link once the server has made it.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const url = await sign({ data: { path } });
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : "Could not open the report.");
    } finally {
      setBusy(null);
    }
  }

  if (!isBucketKey(pdfPath))
    return (
      <span className="text-xs text-muted-foreground">File not uploaded yet (next daily run)</span>
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => open(pdfPath)} disabled={busy !== null}>
        {busy === pdfPath ? <Loader2 className="animate-spin" /> : <Download />} PDF
      </Button>
      {txtPath && isBucketKey(txtPath) && (
        <Button size="sm" variant="ghost" onClick={() => open(txtPath)} disabled={busy !== null}>
          {busy === txtPath ? <Loader2 className="animate-spin" /> : <Download />} Text
        </Button>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

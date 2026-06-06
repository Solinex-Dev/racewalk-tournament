"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvImportDialog } from "./csv-import-dialog";
import type { ImportEntity } from "@/lib/csv/import-types";

/**
 * Root-admin Export/Import CSV toolbar control for a list page. Render only when
 * the current admin is root (the server routes/actions enforce it regardless).
 */
export function CsvExportImport({
  entity,
  exportHref,
}: Readonly<{ entity: ImportEntity; exportHref: string }>) {
  const [importOpen, setImportOpen] = React.useState(false);
  return (
    <>
      <a href={exportHref} download>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-slate-200 text-xs">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </a>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setImportOpen(true)}
        className="gap-1.5 rounded-lg border-slate-200 text-xs"
      >
        <Upload className="h-3.5 w-3.5" /> Import CSV
      </Button>
      <CsvImportDialog entity={entity} open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

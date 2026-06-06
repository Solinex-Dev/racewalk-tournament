"use client";

import * as React from "react";
import { Download, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CsvImportDialog } from "./csv-import-dialog";
import type { ImportEntity } from "@/lib/csv/import-types";

/**
 * Root-admin "Export & Import" control: one button → dropdown with Export / Import.
 * Render only when the current admin is root (server routes/actions enforce it too).
 */
export function CsvExportImport({
  entity,
  exportHref,
}: Readonly<{ entity: ImportEntity; exportHref: string }>) {
  const [importOpen, setImportOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-lg border-slate-200 text-xs">
            Export &amp; Import <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem asChild>
            <a href={exportHref} download className="cursor-pointer">
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CsvImportDialog entity={entity} open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirmation dialog (replaces native window.confirm). Controlled via
 * `open`/`onOpenChange`; runs `onConfirm` when the user confirms.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  destructive = false,
  isPending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-left text-slate-900">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-left text-sm text-slate-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl border-slate-200"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={
              destructive
                ? "rounded-xl bg-red-600 text-white hover:bg-red-700"
                : "rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            }
          >
            {isPending ? "กำลังดำเนินการ…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

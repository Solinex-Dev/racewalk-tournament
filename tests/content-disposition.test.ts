import { describe, it, expect } from "vitest";
import { attachmentContentDisposition } from "@/lib/content-disposition";

describe("attachmentContentDisposition", () => {
  it("emits both filename and filename* for a plain ASCII name", () => {
    const h = attachmentContentDisposition("report.csv");
    expect(h).toContain('filename="report.csv"');
    expect(h).toContain("filename*=UTF-8''report.csv");
  });
  it("replaces filesystem-unsafe characters with underscores", () => {
    const h = attachmentContentDisposition("a/b\\c:d*.csv");
    expect(h).toContain('filename="a_b_c_d_.csv"');
  });
  it("for a Thai name: ASCII fallback uses _, filename* is percent-encoded UTF-8", () => {
    const h = attachmentContentDisposition("เดินทน.xlsx");
    expect(h).toContain('filename="______.xlsx"'); // 6 Thai code units → 6 underscores
    expect(h).toContain("filename*=UTF-8''" + encodeURIComponent("เดินทน.xlsx"));
  });
  it("falls back to 'download' for blank input", () => {
    expect(attachmentContentDisposition("   ")).toContain('filename="download"');
  });
});

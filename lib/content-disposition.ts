/**
 * Builds a safe `Content-Disposition: attachment` header value for a download.
 *
 * HTTP header values are ByteStrings (Latin-1, 0–255), so a non-ASCII filename
 * (e.g. Thai "เดินทน…") cannot appear raw in the legacy `filename="…"` field —
 * doing so throws "Cannot convert argument to a ByteString".
 *
 * Per RFC 5987/6266 we emit both:
 *   - `filename="<ascii fallback>"` for legacy clients (non-ASCII → "_")
 *   - `filename*=UTF-8''<percent-encoded>` for modern browsers (shows the real name)
 */
const UNSAFE = new Set(String.raw`<>:"/\|?*`.split("")); // filesystem/quote-unsafe (keeps - and space)

export function attachmentContentDisposition(rawFilename: string): string {
  let nice = "";
  for (const ch of rawFilename) {
    const code = ch.codePointAt(0) ?? 0;
    nice += UNSAFE.has(ch) || code < 0x20 ? "_" : ch;
  }
  nice = nice.trim() || "download";

  // ASCII-only fallback for the legacy `filename=` field.
  let ascii = "";
  for (const ch of nice) {
    const code = ch.codePointAt(0) ?? 0;
    ascii += code < 0x20 || code > 0x7e || ch === '"' ? "_" : ch;
  }

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nice)}`;
}

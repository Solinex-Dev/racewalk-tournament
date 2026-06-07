import { Card, CardContent } from "@/components/ui/card";
import {
  CHANGELOG_TYPE_LABEL,
  type ChangelogEntry,
} from "@/lib/changelog";

// Format an ISO YYYY-MM-DD WITHOUT timezone drift: build a local Date from the
// parts (new Date("2026-06-07") would parse as UTC midnight and can roll back a
// day depending on the viewer's timezone).
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ChangelogTable({
  entries,
}: Readonly<{ entries: ChangelogEntry[] }>) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200">
      <CardContent className="p-0">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No changelog entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={`${e.date}-${e.version}-${i}`} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-slate-500">
                      {fmtDate(e.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-slate-500">
                      {e.version ? `v${e.version}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-slate-600">
                      {CHANGELOG_TYPE_LABEL[e.type]}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-slate-900">{e.title}</p>
                      {e.details && (
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {e.details}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

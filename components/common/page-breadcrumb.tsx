import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail for admin pages. The last item renders as the current page
 * (no link). Server-compatible (no client hooks) — each page passes the
 * resolved trail, including real entity names (event/round/judge/…).
 */
export function PageBreadcrumb({
  items,
  className,
}: Readonly<{
  items: Crumb[];
  className?: string;
}>) {
  return (
    <nav aria-label="breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="max-w-[16rem] truncate transition-colors hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("max-w-[22rem] truncate", isLast && "font-medium text-slate-700")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="select-none text-slate-300" aria-hidden>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

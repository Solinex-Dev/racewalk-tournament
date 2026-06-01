/**
 * Full-bleed gray canvas for the summary sheet (counteracts SidebarInset inset margins).
 */
export default function SummarySheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#eef2f7] md:-mb-2 md:-mr-2 md:-mt-2">
      {children}
    </div>
  );
}

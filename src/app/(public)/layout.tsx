import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { maintenanceMode } = await getSettings();
  return (
    <div className="flex min-h-screen flex-col">
      {maintenanceMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
          🛠️ TourneyBD is under maintenance. Some features may be temporarily unavailable.
        </div>
      )}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

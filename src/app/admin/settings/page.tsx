import { PageHeader } from "@/components/shared/page-elements";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure default scoring, contact info and maintenance mode."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}

import { PageHeader } from "@/components/shared/page-elements";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure default scoring, contact info and maintenance mode."
      />
      <SettingsForm />
    </div>
  );
}

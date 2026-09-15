import { NextRequest } from "next/server";
import { apiRequireRole, json, errorResponse } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { getSettings, saveSettings, type PlatformSettings } from "@/lib/settings";
import { logAudit } from "@/lib/helpers";

export async function GET() {
  try {
    await apiRequireRole(ROLES.ADMIN);
    return json({ settings: await getSettings() });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to load settings", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await apiRequireRole(ROLES.ADMIN);
    const body = (await req.json()) as Partial<PlatformSettings>;

    const patch: Partial<PlatformSettings> = {};

    for (const key of ["winPoints", "drawPoints", "lossPoints"] as const) {
      if (body[key] !== undefined) {
        const n = Number(body[key]);
        if (!Number.isInteger(n) || n < 0 || n > 100) {
          return errorResponse(`${key} must be a whole number between 0 and 100`, 400);
        }
        patch[key] = n;
      }
    }
    if (body.contactEmail !== undefined) {
      const email = String(body.contactEmail).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse("Enter a valid contact email", 400);
      }
      patch.contactEmail = email;
    }
    if (body.maintenanceMode !== undefined) {
      patch.maintenanceMode = Boolean(body.maintenanceMode);
    }

    if (Object.keys(patch).length === 0) return errorResponse("Nothing to update", 400);

    await saveSettings(patch);
    await logAudit({
      userId: session.id,
      action: "SETTINGS_UPDATE",
      entity: "Setting",
      detail: Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(", "),
    });

    return json({ settings: await getSettings() });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse("Failed to save settings", 500);
  }
}

import { db } from "./db";

// Platform-wide settings, persisted in the Setting key/value table.
// These are read when creating tournaments (scoring defaults) and shown on the
// admin settings page.

export type PlatformSettings = {
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  contactEmail: string;
  maintenanceMode: boolean;
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  contactEmail: "support@tourney.bd",
  maintenanceMode: false,
};

/** Read all platform settings, falling back to defaults for anything unset. */
export async function getSettings(): Promise<PlatformSettings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: keyof PlatformSettings, fallback: number) => {
    const raw = map.get(key);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    winPoints: num("winPoints", DEFAULT_SETTINGS.winPoints),
    drawPoints: num("drawPoints", DEFAULT_SETTINGS.drawPoints),
    lossPoints: num("lossPoints", DEFAULT_SETTINGS.lossPoints),
    contactEmail: map.get("contactEmail") ?? DEFAULT_SETTINGS.contactEmail,
    maintenanceMode: (map.get("maintenanceMode") ?? "false") === "true",
  };
}

/** Upsert a partial set of platform settings. */
export async function saveSettings(patch: Partial<PlatformSettings>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  await db.$transaction(
    entries.map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      }),
    ),
  );
}

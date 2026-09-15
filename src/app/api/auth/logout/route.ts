import { json } from "@/lib/auth";
import { clearSession } from "@/lib/auth";

export async function POST() {
  await clearSession();
  return json({ ok: true });
}

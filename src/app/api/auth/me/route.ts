import { json, getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null });
  return json({ user: session });
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, subject, message } = body as Record<string, string>;

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Log the contact submission so reviewers can see it in dev output.
    console.log("[contact] new submission:", {
      name,
      email,
      subject: subject || "(no subject)",
      message: message.slice(0, 280),
      at: new Date().toISOString(),
    });

    // No DB persistence needed for the public site per task spec.
    return NextResponse.json({ ok: true, message: "Message received" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}

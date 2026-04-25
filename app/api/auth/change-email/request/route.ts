/**
 * 🚧 MOCK — Change email: request code
 * In production: send email with real code
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

interface PendingChange {
  userId: number;
  newEmail: string;
  code: string;
  expiresAt: number;
}

// In-memory store (singleton across HMR)
const globalForPending = globalThis as typeof globalThis & {
  _emailChangePending?: Map<number, PendingChange>;
};
if (!globalForPending._emailChangePending) {
  globalForPending._emailChangePending = new Map();
}
export const pendingEmailChanges = globalForPending._emailChangePending;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { newEmail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const newEmail = body.newEmail?.trim();
  if (!newEmail) {
    return NextResponse.json({ error: "newEmail is required" }, { status: 400 });
  }

  // Check if email already taken
  const existing = db.users.find(
    (u) => u.email === newEmail && u.id !== user.id,
  );
  if (existing) {
    return NextResponse.json(
      { error: "Цей email вже використовується" },
      { status: 400 },
    );
  }

  // Store pending change with mock code
  pendingEmailChanges.set(user.id, {
    userId: user.id,
    newEmail,
    code: "123456",
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // In production: send actual email with code
  console.log(`[MOCK] Email change code for user ${user.id}: 123456 → ${newEmail}`);

  return NextResponse.json({ ok: true });
}

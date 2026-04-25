/**
 * 🚧 MOCK — Change email: confirm code
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";
import { pendingEmailChanges } from "../request/route";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { newEmail?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { newEmail, code } = body;
  if (!newEmail || !code) {
    return NextResponse.json(
      { error: "newEmail and code are required" },
      { status: 400 },
    );
  }

  const pending = pendingEmailChanges.get(user.id);

  if (!pending) {
    return NextResponse.json(
      { error: "Немає активного запиту зміни email" },
      { status: 400 },
    );
  }

  if (pending.expiresAt < Date.now()) {
    pendingEmailChanges.delete(user.id);
    return NextResponse.json({ error: "Код застарів" }, { status: 400 });
  }

  if (pending.newEmail !== newEmail.trim() || pending.code !== code.trim()) {
    return NextResponse.json({ error: "Невірний код" }, { status: 400 });
  }

  // Update user email
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    db.users[idx].email = pending.newEmail;
  }

  pendingEmailChanges.delete(user.id);

  return NextResponse.json(db.toPublicUser(db.users[idx !== -1 ? idx : 0]));
}

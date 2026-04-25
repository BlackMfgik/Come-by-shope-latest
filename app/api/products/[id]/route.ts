/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = db.products.find((p) => p.id === Number(id));
  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user?.admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idx = db.products.findIndex((p) => p.id === Number(id));
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  db.products[idx] = { ...db.products[idx], ...body };
  return NextResponse.json(db.products[idx]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user?.admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idx = db.products.findIndex((p) => p.id === Number(id));
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  // Only allow patching the `hidden` field via PATCH
  if (typeof body.hidden === "boolean") {
    (
      db.products[idx] as (typeof db.products)[number] & { hidden?: boolean }
    ).hidden = body.hidden;
  }
  return NextResponse.json(db.products[idx]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user?.admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const idx = db.products.findIndex((p) => p.id === Number(id));
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.products.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}

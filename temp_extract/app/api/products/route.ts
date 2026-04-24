/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function GET() {
  return NextResponse.json(db.products);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user?.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const product = {
    id: db._nextProductId++,
    name: body.name,
    description: body.description ?? "",
    weight: body.weight ?? "",
    price: Number(body.price),
    imageName: body.imageName ?? "",
    image: body.imageName ? `/images/products/${body.imageName}.png` : "",
    category: body.category ?? "",
  };
  db.products.push(product);
  return NextResponse.json(product, { status: 201 });
}

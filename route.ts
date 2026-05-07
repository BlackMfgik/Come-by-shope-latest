import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не надано" }, { status: 400 });
    }

    // Перевірка типу файлу
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Дозволені лише зображення" },
        { status: 400 },
      );
    }

    // Перевірка розміру (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Файл занадто великий (макс 10MB)" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "come-by-shop/products",
              transformation: [
                { quality: "auto", fetch_format: "auto" },
                { width: 800, height: 800, crop: "limit" },
              ],
            },
            (
              error: import("cloudinary").UploadApiErrorResponse | undefined,
              result: import("cloudinary").UploadApiResponse | undefined,
            ) => {
              if (error || !result) reject(error);
              else resolve(result as { secure_url: string; public_id: string });
            },
          )
          .end(buffer);
      },
    );

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Помилка при завантаженні" },
      { status: 500 },
    );
  }
}

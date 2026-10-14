import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  savePhoto,
  deletePhoto,
  photoStorageDriver,
} from "@/lib/photo-storage";
function vector(unit: string, max: number, nonzero = false) {
  return z
    .string()
    .max(150)
    .refine((value) => {
      const parts = value.trim().split(/\s+/);
      if (parts.length !== 3) return false;
      const values = parts.map((part) =>
        unit
          ? part.endsWith(unit)
            ? Number(part.slice(0, -unit.length))
            : NaN
          : Number(part),
      );
      return (
        values.every((n) => Number.isFinite(n) && Math.abs(n) <= max) &&
        (!nonzero || Math.hypot(...values) > 0.001)
      );
    });
}
const point = z.object({
  position: vector("m", 1000000),
  normal: vector("", 1, true),
});
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  const { id } = await params;
  const parsed = z
    .object({
      hotspots: z.record(
        z.enum(["LEFT_DOOR", "RIGHT_DOOR", "HOOD", "REAR_BODY"]),
        point,
      ),
    })
    .safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Некорректные координаты зон." },
      { status: 400 },
    );
  await prisma.car.update({
    where: { id },
    data: { modelHotspots: parsed.data.hotspots },
  });
  return NextResponse.json({ success: true });
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  const { id } = await params;
  const car = await prisma.car.findUnique({ where: { id } });
  if (!car)
    return NextResponse.json(
      { error: "Автомобиль не найден." },
      { status: 404 },
    );
  try {
    const max = 4 * 1024 * 1024;
    if (Number(req.headers.get("content-length") || 0) > max + 65536)
      return NextResponse.json(
        { error: "GLB должен быть меньше 4 МБ." },
        { status: 413 },
      );
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size > max || file.size < 24)
      return NextResponse.json(
        { error: "Выберите GLB до 4 МБ." },
        { status: 400 },
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      bytes.readUInt32LE(0) !== 0x46546c67 ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length ||
      bytes.readUInt32LE(16) !== 0x4e4f534a
    )
      throw new Error("INVALID_GLB");
    const length = bytes.readUInt32LE(12);
    if (length > bytes.length - 20) throw new Error("INVALID_GLB");
    const json = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"));
    // Self-contained models only: no external network requests or texture URIs.
    if (
      [...(json.buffers || []), ...(json.images || [])].some(
        (v: { uri?: string }) => v.uri,
      ) ||
      (json.nodes?.length || 0) > 10000 ||
      !json.meshes?.length
    )
      throw new Error("INVALID_GLB");
    const assetId = randomUUID();
    const key = `car-models/${assetId}.glb`;
    const driver = photoStorageDriver();
    await savePhoto(key, bytes, driver, "model/gltf-binary");
    try {
      await prisma.$transaction(async (tx) => {
        await tx.mediaAsset.create({
          data: {
            id: assetId,
            carId: id,
            ownerId: car.ownerId,
            storageKey: key,
            storageDriver: driver,
            sizeBytes: bytes.length,
            kind: "MODEL",
            contentType: "model/gltf-binary",
          },
        });
        await tx.car.update({
          where: { id },
          data: { modelAssetId: assetId, modelHotspots: {} },
        });
      });
    } catch (error) {
      await deletePhoto(key, driver).catch(() => {});
      throw error;
    }
    return NextResponse.json({
      success: true,
      modelUrl: `/api/media/${assetId}`,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Модель не сохранена. Нужен GLB 2.0 со встроенными текстурами, до 4 МБ.",
      },
      { status: 400 },
    );
  }
}

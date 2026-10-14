import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({
  photoUrls: z.array(z.string().url()).max(8),
  note: z.string().trim().min(5).max(1500),
});
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getServerSession(authOptions);
  if (s?.user.role !== "SELLER")
    return NextResponse.json({ error: "Нет доступа." }, { status: 403 });
  const { id } = await params;
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success)
      return NextResponse.json(
        { error: "Добавьте пояснение." },
        { status: 400 },
      );
    const car = await prisma.car.findFirst({
      where: {
        id,
        ownerId: s.user.id,
        status: { in: ["NEEDS_INFO", "REJECTED"] },
      },
    });
    if (!car)
      return NextResponse.json(
        { error: "Заявка недоступна для повторной отправки." },
        { status: 409 },
      );
    const ids = body.data.photoUrls.map(
      (u) => new URL(u).pathname.match(/^\/api\/media\/([a-f0-9-]{36})$/)?.[1],
    );
    if (ids.some((x) => !x) || new Set(ids).size !== ids.length)
      return NextResponse.json(
        { error: "Загрузите фото через форму." },
        { status: 400 },
      );
    const mediaIds = ids as string[];
    const count = await prisma.mediaAsset.count({
      where: {
        id: { in: mediaIds },
        ownerId: s.user.id,
        carId: null,
        kind: "PHOTO",
      },
    });
    if (count !== ids.length)
      return NextResponse.json(
        { error: "Фотографии недоступны." },
        { status: 400 },
      );
    await prisma.$transaction(async (tx) => {
      const linked = await tx.mediaAsset.updateMany({
        where: { id: { in: mediaIds }, ownerId: s.user.id, carId: null },
        data: { carId: id },
      });
      if (linked.count !== ids.length) throw new Error("ALREADY_LINKED");
      const photoUrls = [
        ...car.photoUrls,
        ...mediaIds.map((x) => `${process.env.NEXTAUTH_URL}/api/media/${x}`),
      ].slice(-16);
      const result = await tx.car.updateMany({
        where: {
          id,
          ownerId: s.user.id,
          status: { in: ["NEEDS_INFO", "REJECTED"] },
        },
        data: { status: "PENDING", photoUrls },
      });
      if (!result.count) throw new Error("STATE_CHANGED");
      await tx.moderationMessage.create({
        data: {
          carId: id,
          status: "PENDING",
          body: body.data.note,
          emailStatus: "NOT_REQUIRED",
        },
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Не удалось отправить уточнение." },
      { status: 503 },
    );
  }
}

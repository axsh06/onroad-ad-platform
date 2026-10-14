import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { put, get, del } from "@vercel/blob";

type PhotoStorageDriver = "local" | "s3" | "vercel-blob";

let client: S3Client | undefined;
function s3() {
  const required = [
    "S3_BUCKET",
    "S3_REGION",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ] as const;
  if (required.some((key) => !process.env[key]))
    throw new Error("STORAGE_NOT_CONFIGURED");
  return (client ??= new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  }));
}

export function photoStorageDriver(): PhotoStorageDriver {
  if (process.env.STORAGE_DRIVER === "s3") return "s3";
  if (process.env.STORAGE_DRIVER === "vercel-blob") return "vercel-blob";
  // Never silently write to the ephemeral filesystem of a deployed application.
  if (process.env.NODE_ENV === "production")
    throw new Error("STORAGE_NOT_CONFIGURED");
  return "local";
}
function localPath(key: string) {
  if (
    !/^(car-photos\/[a-f0-9-]{36}\.jpg|car-models\/[a-f0-9-]{36}\.glb)$/.test(
      key,
    )
  )
    throw new Error("INVALID_KEY");
  return path.join(process.cwd(), ".data", key);
}
export async function savePhoto(
  key: string,
  bytes: Buffer,
  driver: PhotoStorageDriver,
  contentType = "image/jpeg",
) {
  if (driver === "vercel-blob") {
    await put(key, bytes, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  } else if (driver === "s3") {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  } else {
    const filename = localPath(key);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, bytes, { flag: "wx" });
  }
}
export async function readPhoto(key: string, driver: string) {
  if (driver === "vercel-blob") {
    const result = await get(key, { access: "private" });
    if (result?.statusCode !== 200) throw new Error("EMPTY_OBJECT");
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }
  if (driver === "local") return new Uint8Array(await readFile(localPath(key)));
  if (driver !== "s3") throw new Error("INVALID_DRIVER");
  const result = await s3().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  if (!result.Body) throw new Error("EMPTY_OBJECT");
  return result.Body.transformToByteArray();
}
export async function deletePhoto(key: string, driver: PhotoStorageDriver) {
  if (driver === "vercel-blob") await del(key);
  else if (driver === "s3")
    await s3().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  else await unlink(localPath(key));
}

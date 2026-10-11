import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { fail } from "./database.js";

export async function saveProductImage(value) {
  const match = String(value || "").match(
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match) fail("Use a PNG, JPEG, or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024)
    fail("Image must be smaller than 4 MB.");
  const valid =
    match[1] === "png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid) fail("The image file is invalid.");
  const directory = fileURLToPath(
    new URL("../../public/uploads/products/", import.meta.url),
  );
  await mkdir(directory, { recursive: true });
  const name = randomUUID() + "." + (match[1] === "jpeg" ? "jpg" : match[1]);
  await writeFile(directory + name, bytes, { flag: "wx" });
  return "/public/uploads/products/" + name;
}

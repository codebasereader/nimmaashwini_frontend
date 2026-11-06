import { apiRequest } from "./client";

const MAX_DIRECT_UPLOAD_BYTES = 4 * 1024 * 1024;

const WEBP_QUALITY = 0.85;

/** Re-encodes JPEG/PNG as WebP in the browser; falls back to the original file if that fails. */
async function convertToWebp(file) {
  if (file.type === "image/webp") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.type !== "image/webp") return file;

    const name = file.name.replace(/[.][^.]+$/, "") || "image";
    return new File([blob], `${name}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(originalFile, folder, token) {
  const file = await convertToWebp(originalFile);
  if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
    throw new Error("Image is too large. Please use a file under 4 MB.");
  }

  const base64 = await readFileAsDataUrl(file);

  const data = await apiRequest("/admin/upload/image", {
    method: "POST",
    body: {
      fileName: file.name,
      contentType: file.type || "image/png",
      folder,
      base64,
    },
    token,
  });

  return {
    key: data.key,
    url: data.publicUrl || data.url,
    alt: file.name,
  };
}

export function deleteUploadedFile(key, token) {
  return apiRequest("/admin/upload/delete", {
    method: "POST",
    body: { key },
    token,
  });
}

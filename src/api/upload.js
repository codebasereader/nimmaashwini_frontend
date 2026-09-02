import { apiRequest } from "./client";

const MAX_DIRECT_UPLOAD_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file, folder, token) {
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

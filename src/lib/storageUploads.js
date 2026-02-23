// src/lib/storageUploads.js
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a Blob/File to a storage path, return { url, path }.
 */
export async function uploadBlobAndGetUrl(blob, path, contentType = null) {
  const fileRef = ref(storage, path);
  const metadata = contentType ? { contentType } : undefined;
  await uploadBytes(fileRef, blob, metadata);
  const url = await getDownloadURL(fileRef);
  return { url, path };
}

/**
 * Delete a file in storage by its storage path (e.g. "blog/<id>/cover/xxx.webp")
 */
export async function deleteByPath(path) {
  if (!path) return;
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}

/**
 * Turn a Firebase Storage download URL into a storage path.
 * Works for URLs like:
 * https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
 */
export function storagePathFromDownloadUrl(downloadUrl) {
  try {
    const u = new URL(downloadUrl);
    const parts = u.pathname.split("/o/");
    if (parts.length < 2) return null;
    const encodedPath = parts[1];
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

/**
 * Small helper to build safe-ish filenames
 */
export function safeName(name) {
  return (name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Client-side image compression (WebP by default).
 * - maxWidth/maxHeight keeps it from uploading huge originals
 * - quality controls size vs quality
 */
export async function compressImageFile(
  file,
  {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.82,
    mimeType = "image/webp", // "image/jpeg" also ok
  } = {},
) {
  if (!file) return null;

  // decode
  const bitmap = await createImageBitmap(file);

  // scale
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, quality),
  );

  bitmap.close?.();

  return blob; // Blob with compressed image
}

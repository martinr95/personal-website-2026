import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a File to a storage path, return downloadURL
 */
export async function uploadFileAndGetUrl(file, path) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
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

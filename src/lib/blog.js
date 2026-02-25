// src/lib/blog.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteByPath, storagePathFromDownloadUrl } from "./storageUploads"; // ✅ add

const blogCol = collection(db, "blog_posts");

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  // old-style ["url1","url2"] -> objects with path null
  if (gallery.length > 0 && typeof gallery[0] === "string") {
    return gallery.map((url) => ({ url, path: null }));
  }
  return gallery
    .map((x) => ({
      url: typeof x?.url === "string" ? x.url : "",
      path: typeof x?.path === "string" ? x.path : null,
    }))
    .filter((x) => x.url);
}

function normalizePost(d) {
  const data = d.data();
  const postType = data.postType === "social" ? "social" : "blog"; // default
  return {
    id: d.id,
    ...data,
    postType,
    gallery: normalizeGallery(data.gallery),
  };
}

export async function listBlogPosts() {
  const q = query(blogCol, orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(normalizePost);
}

/**
 * List published posts, optionally filtered by type.
 * - type: "blog" | "social" | null (null = all types)
 */
export async function listPublishedPosts({ type = null } = {}) {
  const clauses = [where("published", "==", true)];

  // Only filter if type provided
  if (type) clauses.push(where("postType", "==", type));

  // Note: if you filter by postType + orderBy date, Firestore may require a composite index.
  const q = query(blogCol, ...clauses, orderBy("date", "desc"));

  const snap = await getDocs(q);
  return snap.docs.map(normalizePost);
}

// Convenience wrappers (as you requested)
export async function listPublishedBlogPosts() {
  return listPublishedPosts({ type: "blog" });
}

export async function listPublishedSocialPosts() {
  return listPublishedPosts({ type: "social" });
}

export async function listAllPublishedPosts() {
  return listPublishedPosts({ type: null });
}

export async function getBlogPost(id) {
  const ref = doc(db, "blog_posts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data();
  const postType = data.postType === "social" ? "social" : "blog";

  return {
    id: snap.id,
    ...data,
    postType,
    gallery: normalizeGallery(data.gallery),
  };
}

export async function createBlogPost(payload) {
  const docRef = await addDoc(blogCol, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBlogPost(id, payload) {
  const ref = doc(db, "blog_posts", id);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteBlogPost(id) {
  if (!id) throw new Error("Missing post id");

  // 1) load post data (to know which storage objects to delete)
  const ref = doc(db, "blog_posts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return; // already gone -> nothing to do

  const data = snap.data();

  // 2) collect all storage paths we can safely delete
  const paths = new Set();

  // cover
  if (typeof data.coverPath === "string" && data.coverPath) {
    paths.add(data.coverPath);
  } else if (typeof data.coverUrl === "string" && data.coverUrl) {
    const p = storagePathFromDownloadUrl(data.coverUrl);
    if (p) paths.add(p);
  }

  // gallery (supports old and new format)
  const gallery = Array.isArray(data.gallery) ? data.gallery : [];
  for (const g of gallery) {
    if (typeof g === "string") {
      // old format: url string
      const p = storagePathFromDownloadUrl(g);
      if (p) paths.add(p);
    } else if (g && typeof g === "object") {
      if (typeof g.path === "string" && g.path) {
        paths.add(g.path);
      } else if (typeof g.url === "string" && g.url) {
        const p = storagePathFromDownloadUrl(g.url);
        if (p) paths.add(p);
      }
    }
  }

  // 3) delete storage objects (best effort)
  // If a single delete fails, we still try the others.
  const results = await Promise.allSettled(
    Array.from(paths).map((p) => deleteByPath(p)),
  );

  // Optional: log failures (but don't block post deletion)
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(
      `[deleteBlogPost] ${failed.length} storage deletions failed for post ${id}`,
      failed,
    );
  }

  // 4) delete the Firestore doc
  await deleteDoc(ref);
}

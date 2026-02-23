// src/lib/blog.js
import {
  addDoc,
  collection,
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

const blogCol = collection(db, "blog_posts");

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) return [];
  // if it's old-style ["url1","url2"] convert to objects with path null
  if (gallery.length > 0 && typeof gallery[0] === "string") {
    return gallery.map((url) => ({ url, path: null }));
  }
  // expected [{url,path}]
  return gallery
    .map((x) => ({
      url: typeof x?.url === "string" ? x.url : "",
      path: typeof x?.path === "string" ? x.path : null,
    }))
    .filter((x) => x.url);
}

function normalizePost(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    gallery: normalizeGallery(data.gallery),
  };
}

export async function listBlogPosts() {
  const q = query(blogCol, orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(normalizePost);
}

export async function listPublishedBlogPosts() {
  const q = query(
    blogCol,
    where("published", "==", true),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalizePost);
}

export async function getBlogPost(id) {
  const ref = doc(db, "blog_posts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
    gallery: normalizeGallery(snap.data().gallery),
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

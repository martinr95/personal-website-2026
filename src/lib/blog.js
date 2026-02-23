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

export async function listBlogPosts() {
  const q = query(blogCol, orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listPublishedBlogPosts() {
  const q = query(
    blogCol,
    where("published", "==", true),
    orderBy("date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBlogPost(id) {
  const ref = doc(db, "blog_posts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
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

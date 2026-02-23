import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const blogCol = collection(db, "blog");

export async function listBlogPosts() {
  const q = query(blogCol, orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createBlogPost(post) {
  const payload = {
    ...post,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(blogCol, payload);
  return docRef.id;
}

export async function updateBlogPost(id, post) {
  const ref = doc(db, "blog", id);
  const payload = {
    ...post,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
}

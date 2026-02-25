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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const seriesCol = collection(db, "blog_series");

function normalizeSeries(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
}

export async function listSeries() {
  const q = query(seriesCol, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeSeries);
}

export async function getSeries(id) {
  const ref = doc(db, "blog_series", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeSeries(snap);
}

export async function createSeries(payload) {
  const docRef = await addDoc(seriesCol, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSeries(id, payload) {
  const ref = doc(db, "blog_series", id);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteSeries(id) {
  // 1) find posts that reference this series
  const postsCol = collection(db, "blog_posts");
  const q = query(postsCol, where("seriesId", "==", id));
  const snap = await getDocs(q);

  const docs = snap.docs;

  // 2) clear series fields on posts in batches (max 500 writes per batch)
  const chunkSize = 450; // keep buffer
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + chunkSize);

    for (const d of chunk) {
      batch.update(d.ref, {
        seriesId: null,
        seriesName: null,
        seriesSlug: null,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  // 3) delete the series doc itself
  const ref = doc(db, "blog_series", id);
  await deleteDoc(ref);
}

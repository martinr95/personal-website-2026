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

const booksCol = collection(db, "books");

export async function listBooks() {
  const q = query(booksCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createBook(book) {
  const payload = {
    ...book,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(booksCol, payload);
  return docRef.id;
}

export async function updateBook(bookId, updates) {
  const ref = doc(db, "books", bookId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
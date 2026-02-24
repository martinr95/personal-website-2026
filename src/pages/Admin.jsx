import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import AdminBooks from "./admin/AdminBooks";
import AdminBlog from "./admin/AdminBlog";

export default function Admin() {
  const [user, setUser] = useState(null);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  // which tool is open?
  // null = hub view
  // "books" | "blog" | "social"
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setMode(null);
  }

  function goBackToHub() {
    setMode(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">Admin</h1>

        {user ? (
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md border hover:bg-gray-50"
          >
            Log out
          </button>
        ) : null}
      </div>

      {user ? (
        <div className="space-y-6">
          <div className="text-gray-700 text-sm">
            Logged in as <span className="font-medium">{user.email}</span>
          </div>
          <div className="text-gray-700 text-sm">v.0.1.0-alpha</div>

          {/* Tool router */}
          {mode === "books" ? (
            <AdminBooks onBack={goBackToHub} />
          ) : mode === "blog" ? (
            <AdminBlog onBack={goBackToHub} />
          ) : mode === "social" ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Social posts</div>
                  <div className="text-sm text-gray-700">Coming next.</div>
                </div>
                <button
                  type="button"
                  onClick={goBackToHub}
                  className="px-3 py-2 rounded-md border hover:bg-gray-50"
                >
                  ← Back
                </button>
              </div>
            </div>
          ) : (
            // Hub view (select content type)
            <div className="space-y-3 border rounded-lg p-4">
              <div>
                <div className="font-medium">What do you want to create?</div>
                <div className="text-sm text-gray-700">
                  Choose a content type.
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setMode("books")}
                  className="border rounded-lg p-3 text-left hover:bg-gray-50"
                >
                  <div className="font-medium">Books</div>
                  <div className="text-sm text-gray-700">Your reading log</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("blog")}
                  className="border rounded-lg p-3 text-left hover:bg-gray-50"
                >
                  <div className="font-medium">Blog</div>
                  <div className="text-sm text-gray-700">Longer posts</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("social")}
                  className="border rounded-lg p-3 text-left hover:bg-gray-50"
                >
                  <div className="font-medium">Social</div>
                  <div className="text-sm text-gray-700">Diary feed</div>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleLogin}
          className="space-y-3 border rounded-lg p-4 max-w-md"
        >
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">Password</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          {err ? <div className="text-sm text-red-600">{err}</div> : null}

          <button className="px-4 py-2 rounded-md bg-black text-white">
            Log in
          </button>
        </form>
      )}
    </div>
  );
}

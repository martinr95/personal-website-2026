import { useEffect, useMemo, useState } from "react";
import { createBook, listBooks, updateBook } from "../../lib/books";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const TAGS = [
  "magical realism",
  "dystopia",
  "science fiction",
  "classic",
  "italian literature",
  "latin america",
  "philosophy",
  "history",
  "steampunk",
  "fantasy",
];

export default function AdminBooks({ onBack }) {
  // book form
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState("");
  const [finishedAt, setFinishedAt] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedTags, setSelectedTags] = useState([]);
  const [favorites, setFavorites] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [prize, setPrize] = useState("");

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // books list + editing
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [editingId, setEditingId] = useState(null); // book id or null

  async function refreshBooks() {
    setBooksLoading(true);
    try {
      const data = await listBooks();
      setBooks(data);
    } finally {
      setBooksLoading(false);
    }
  }

  useEffect(() => {
    refreshBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  const parsedRating = useMemo(() => {
    if (rating === "") return null;
    const n = Number(rating);
    if (Number.isNaN(n)) return null;
    return n;
  }, [rating]);

  const ratingError =
    parsedRating !== null && (parsedRating < 1 || parsedRating > 10)
      ? "Rating must be between 1 and 10."
      : "";

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setRating("");
    setFinishedAt("");
    setNotes("");
    setSelectedTags([]);
    setFavorites(false);
    setSuggested(false);
    setPrize("");
    setSavedMsg("");
  }

  function loadBookIntoForm(b) {
    setEditingId(b.id);

    setTitle(b.title ?? "");
    setAuthor(b.author ?? "");
    setRating(
      typeof b.rating === "number" || typeof b.rating === "string"
        ? String(b.rating)
        : "",
    );

    // stored as YYYY-MM-DD string (or null)
    setFinishedAt(typeof b.finishedAt === "string" ? b.finishedAt : "");

    setNotes(b.notes ?? "");
    setSelectedTags(Array.isArray(b.tags) ? b.tags : []);
    setFavorites(Boolean(b.favorites));
    setSuggested(Boolean(b.suggested));
    setPrize(b.prize ?? "");

    setSavedMsg("");
  }

  async function handleSubmitBook(e) {
    e.preventDefault();
    setSavedMsg("");

    if (!title.trim()) return;

    if (parsedRating !== null && (parsedRating < 1 || parsedRating > 10)) {
      return;
    }

    const payload = {
      title: title.trim(),
      author: author.trim(),
      rating: parsedRating, // number or null
      finishedAt: finishedAt ? finishedAt : null, // string date or null
      notes: notes, // keep rich text HTML as-is (don't .trim())
      tags: selectedTags,
      favorites,
      suggested,
      prize: prize.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateBook(editingId, payload);
        setSavedMsg("Updated.");
      } else {
        await createBook(payload);
        setSavedMsg("Saved.");
      }

      resetForm();
      refreshBooks();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Books</h2>
          <p className="text-sm text-gray-700">
            Create & edit your book entries.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 rounded-md border hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      <form
        onSubmit={handleSubmitBook}
        className="space-y-3 border rounded-lg p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            {editingId ? (
              <>
                Editing{" "}
                <span className="font-medium">
                  {author ? author : "—"} — {title ? title : "(untitled)"}
                </span>
              </>
            ) : (
              "Create book"
            )}
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
            >
              Cancel editing
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Title *</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pedro Páramo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">Author</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Juan Rulfo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">
              Rating (1–10, decimals ok)
            </label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g. 9.2"
            />
            {ratingError ? (
              <div className="text-xs text-red-600">{ratingError}</div>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">Finished date</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="date"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Personal prize</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              placeholder='e.g. "Outstanding literary value"'
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-700">Tags</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`text-xs border rounded px-2 py-1 ${
                    active ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={favorites}
              onChange={(e) => setFavorites(e.target.checked)}
            />
            favorites
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={suggested}
              onChange={(e) => setSuggested(e.target.checked)}
            />
            suggested
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700">Notes</label>
          <ReactQuill
            theme="snow"
            value={notes}
            onChange={setNotes}
            placeholder="Short thoughts…"
          />
        </div>

        {savedMsg ? (
          <div className="text-sm text-gray-700">{savedMsg}</div>
        ) : null}

        <button
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : editingId ? "Update book" : "Add book"}
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-gray-700">Your books</div>

          <button
            type="button"
            onClick={refreshBooks}
            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {booksLoading ? (
            <div className="p-3 text-sm text-gray-700">Loading…</div>
          ) : books.length === 0 ? (
            <div className="p-3 text-sm text-gray-700">No books yet.</div>
          ) : (
            <ul className="divide-y">
              {books.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => loadBookIntoForm(b)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 ${
                      editingId === b.id ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="text-sm">
                      <span className="text-gray-600">{b.author ?? "—"}</span>
                      <span className="text-gray-400"> — </span>
                      <span className="font-medium">
                        {b.title ?? "(untitled)"}
                      </span>
                    </div>
                    <span className="text-gray-500">✎</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

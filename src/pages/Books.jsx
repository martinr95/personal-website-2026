import { useEffect, useState } from "react";
import { listBooks } from "../lib/books";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listBooks();
    setBooks(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function getRatingColor(rating) {
    if (typeof rating !== "number") return "text-gray-600";
    if (rating <= 5) return "text-red-600 font-medium";
    if (rating > 8.5) return "text-indigo-800 font-bold";
    return "text-gray-900 font-medium"; // default black-ish
  }

  function getCardBg(isFavorite) {
    return isFavorite ? "bg-indigo-200" : "border bg-white";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Books</h1>
        <p className="text-gray-700">I do read sometimes.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-gray-700">Loading…</div>
        ) : books.length === 0 ? (
          <div className="text-gray-700">No books yet.</div>
        ) : (
          books.map((b) => (
            <article
              key={b.id}
              className={`rounded-lg p-4 ${getCardBg(b.favorites)}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold">{b.title}</h2>

                <div className={`text-sm ${getRatingColor(b.rating)}`}>
                  {typeof b.rating === "number" ? `${b.rating}/10` : ""}
                </div>
              </div>

              <div className="text-sm text-gray-600">{b.author}</div>
              {b.shortDesc ? (
                <div className="mt-3 text-sm text-gray-700 font-semibold mb-4">
                  {b.shortDesc}
                </div>
              ) : null}

              {(b.favorites || b.suggested) && (
                <div className="mt-2 flex gap-2 text-xs">
                  {b.suggested ? (
                    <span className="rounded px-2 py-1 bg-amber-200">
                      suggested
                    </span>
                  ) : null}
                  {b.favorites ? (
                    <span className="rounded px-2 py-1 bg-indigo-400 font-bold">
                      favorite
                    </span>
                  ) : null}
                </div>
              )}

              {Array.isArray(b.tags) && b.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {b.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs border rounded px-2 py-1 text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {b.notes ? (
                <div
                  className="mt-2 prose prose-sm max-w-none break-words overflow-hidden prose-img:max-w-full prose-img:h-auto"
                  dangerouslySetInnerHTML={{ __html: b.notes }}
                />
              ) : null}

              {b.prize ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 border border-black text-black text-xs font-semibold">
                    ✦
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {b.prize}
                  </div>
                </div>
              ) : null}

              {/*   {b.prize ? (
                <div className="mt-3">
                  <div className="relative border border-gray-300 bg-gray-50 px-4 py-2">
                    <div className="absolute left-0 top-0 h-full w-1 bg-black" />
                    <div className="text-xs tracking-wide text-gray-500 uppercase">
                      Personal Award
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {b.prize}
                    </div>
                  </div>
                </div>
              ) : null}
              */}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

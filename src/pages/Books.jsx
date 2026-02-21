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
            <article key={b.id} className="border rounded-lg p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold">{b.title}</h2>

                <div className="text-sm text-gray-600">
                  {typeof b.rating === "number" ? `${b.rating}/10` : ""}
                </div>
              </div>

              <div className="text-sm text-gray-600">{b.author}</div>

              {(b.favorites || b.suggested) && (
                <div className="mt-2 flex gap-2 text-xs">
                     {b.suggested ? (
                    <span className="rounded px-2 py-1 bg-amber-200">suggested</span>
                  ) : null}
                  {b.favorites ? (
                    <span className="rounded px-2 py-1 bg-indigo-200 font-bold">favorite</span>
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

              {b.prize ? (
                <div className="mt-2 text-sm text-gray-800">
                  <span className="font-medium">{b.prize}</span>
                </div>
              ) : null}

              {b.notes ? <p className="mt-2 text-gray-800">{b.notes}</p> : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
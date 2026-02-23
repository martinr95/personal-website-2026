import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublishedBlogPosts } from "../lib/blog";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listPublishedBlogPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blog</h1>
        <p className="text-gray-700">
          Random notes, travel, books, coding — whatever sticks.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-700">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-700">No blog posts yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.id}`}
              className="group border rounded-lg overflow-hidden hover:bg-gray-50 transition"
            >
              {/* cover */}
              <div className="aspect-[16/9] bg-gray-100">
                {p.coverUrl ? (
                  <img
                    src={p.coverUrl}
                    alt={p.title || "Cover"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    no cover
                  </div>
                )}
              </div>

              {/* text */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug group-hover:underline">
                    {p.title ?? "(untitled)"}
                  </h2>
                </div>

                {p.description ? (
                  <p className="text-sm text-gray-700">{p.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">no description</p>
                )}

                {Array.isArray(p.tags) && p.tags.length > 0 ? (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs border rounded px-2 py-1 text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

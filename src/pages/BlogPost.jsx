import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogPost } from "../lib/blog";

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      const data = await getBlogPost(id);
      if (!active) return;
      setPost(data);
      setLoading(false);
    }

    run();
    return () => {
      active = false;
    };
  }, [id]);

  // supports:
  // - old gallery: ["url", ...]
  // - new gallery: [{ url, path }, ...]
  const galleryUrls = useMemo(() => {
    if (!post || !Array.isArray(post.gallery)) return [];
    return post.gallery
      .map((g) => {
        if (typeof g === "string") return g; // old format
        if (g && typeof g === "object" && typeof g.url === "string")
          return g.url; // new format
        return null;
      })
      .filter(Boolean);
  }, [post]);

  if (loading) {
    return <div className="text-gray-700">Loading…</div>;
  }

  if (!post) {
    return (
      <div className="space-y-3">
        <div className="text-gray-700">Post not found.</div>
        <Link to="/blog" className="underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/blog" className="text-sm underline text-gray-700">
          ← Back to Blog
        </Link>

        {post.date ? (
          <div className="text-sm text-gray-600">{post.date}</div>
        ) : null}
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight">
          {post.title ?? "(untitled)"}
        </h1>

        {post.description ? (
          <p className="text-gray-700">{post.description}</p>
        ) : null}

        {Array.isArray(post.tags) && post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="text-xs border rounded px-2 py-1 text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {post.coverUrl ? (
        <img
          src={post.coverUrl}
          alt="Cover"
          className="w-full max-h-[520px] object-cover rounded-lg border"
        />
      ) : null}

      {post.content ? (
        <div
          className="prose prose-sm max-w-none break-words overflow-hidden prose-img:max-w-full prose-img:h-auto"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : (
        <div className="text-gray-400 italic">No content.</div>
      )}

      {galleryUrls.length > 0 ? (
        <section className="space-y-2">
          <div className="text-sm text-gray-700">Gallery</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {galleryUrls.map((url, idx) => (
              <a
                key={url + idx}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block border rounded overflow-hidden hover:opacity-90"
              >
                <img
                  src={url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover aspect-square"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  return (
    <Link
      to={`/blog/${post.id}`}
      className="group border rounded-lg overflow-hidden hover:bg-gray-50 transition"
    >
      {/* cover */}
      <div className="aspect-[16/9] bg-gray-100">
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title || "Cover"}
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
            {post.title ?? "(untitled)"}
          </h2>
        </div>

        {post.description ? (
          <p className="text-sm text-gray-700">{post.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">no description</p>
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 ? (
          <div className="pt-1 flex flex-wrap gap-2">
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
      </div>
    </Link>
  );
}

import { useEffect, useState } from "react";
import { listPublishedSocialPosts } from "../lib/blog";
import PostCard from "../components/PostCard";

export default function Social() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listPublishedSocialPosts();
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
        <h1 className="text-2xl font-semibold">Social</h1>
        <p className="text-gray-700">
          Shorter posts, quick updates, small thoughts — the “personal feed”.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-700">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-700">No social posts yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createBlogPost, listBlogPosts, updateBlogPost } from "../../lib/blog";

const BLOG_TAGS = [
  "travel",
  "vienna",
  "dolomites",
  "thoughts",
  "books",
  "law",
  "coding",
  "life",
  "food",
];

export default function AdminBlog({ onBack }) {
  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [content, setContent] = useState(""); // richtext HTML

  const [selectedTags, setSelectedTags] = useState([]);

  const [coverUrl, setCoverUrl] = useState("");
  const [galleryInput, setGalleryInput] = useState(""); // textarea of URLs
  const galleryUrls = useMemo(() => {
    // each line = one url
    return galleryInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [galleryInput]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // list + editing
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  async function refresh() {
    setPostsLoading(true);
    try {
      const data = await listBlogPosts();
      setPosts(data);
    } finally {
      setPostsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDesc("");
    setDate("");
    setSelectedTags([]);
    setCoverUrl("");
    setGalleryInput("");
    setContent("");
    setSavedMsg("");
  }

  function loadIntoForm(p) {
    setEditingId(p.id);
    setTitle(p.title ?? "");
    setDesc(p.description ?? "");
    setDate(typeof p.date === "string" ? p.date : "");
    setSelectedTags(Array.isArray(p.tags) ? p.tags : []);
    setCoverUrl(p.coverUrl ?? "");
    setGalleryInput(Array.isArray(p.gallery) ? p.gallery.join("\n") : "");
    setContent(p.content ?? "");
    setSavedMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSavedMsg("");

    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: desc.trim(),
      date: date ? date : null, // YYYY-MM-DD or null
      tags: selectedTags,
      coverUrl: coverUrl.trim() || null,
      gallery: galleryUrls, // array of urls
      content, // richtext HTML
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateBlogPost(editingId, payload);
        setSavedMsg("Updated.");
      } else {
        await createBlogPost(payload);
        setSavedMsg("Saved.");
      }
      resetForm();
      refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Blog</h2>
          <p className="text-sm text-gray-700">
            Create & edit blog entries (title + description + richtext +
            images).
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

      {/* form */}
      <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            {editingId ? (
              <>
                Editing{" "}
                <span className="font-medium">{title || "(untitled)"}</span>
              </>
            ) : (
              "Create blog entry"
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
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Title *</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A week of reading + coding"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Short description</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="A short teaser line for previews…"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">Date</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-700">Cover image URL</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="text-sm text-gray-700">Tags</div>
            <div className="flex flex-wrap gap-2">
              {BLOG_TAGS.map((t) => {
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

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">
              Gallery image URLs (one per line)
            </label>
            <textarea
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              value={galleryInput}
              onChange={(e) => setGalleryInput(e.target.value)}
              placeholder={"https://...\nhttps://...\nhttps://..."}
            />
            {galleryUrls.length > 0 ? (
              <div className="text-xs text-gray-600">
                {galleryUrls.length} image{galleryUrls.length === 1 ? "" : "s"}{" "}
                in gallery
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700">Rich text</label>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            placeholder="Write something…"
          />
        </div>

        {savedMsg ? (
          <div className="text-sm text-gray-700">{savedMsg}</div>
        ) : null}

        <button
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : editingId ? "Update post" : "Add post"}
        </button>
      </form>

      {/* list */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-gray-700">Your blog entries</div>

          <button
            type="button"
            onClick={refresh}
            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {postsLoading ? (
            <div className="p-3 text-sm text-gray-700">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="p-3 text-sm text-gray-700">No entries yet.</div>
          ) : (
            <ul className="divide-y">
              {posts.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => loadIntoForm(p)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-50 ${
                      editingId === p.id ? "bg-gray-50" : ""
                    }`}
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {p.title ?? "(untitled)"}
                      </span>
                      <span className="text-gray-400"> · </span>
                      <span className="text-gray-600">
                        {p.date ?? "no date"}
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

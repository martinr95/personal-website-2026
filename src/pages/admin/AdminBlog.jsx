import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createBlogPost, listBlogPosts, updateBlogPost } from "../../lib/blog";
import { uploadFileAndGetUrl, safeName } from "../../lib/storageUploads";
import { BLOG_TAGS } from "../../constants/tags";

export default function AdminBlog({ onBack }) {
  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [content, setContent] = useState(""); // richtext HTML
  const [selectedTags, setSelectedTags] = useState([]);
  const [published, setPublished] = useState(false);

  // images (new)
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [galleryFiles, setGalleryFiles] = useState([]); // File[]
  const [galleryPreviews, setGalleryPreviews] = useState([]); // string[]

  // existing saved urls (when editing)
  const [existingCoverUrl, setExistingCoverUrl] = useState("");
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]); // string[]

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // list + editing
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // upload progress msg (simple)
  const [uploadMsg, setUploadMsg] = useState("");

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
    // cleanup previews when component unmounts
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
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
    setContent("");
    setPublished(false);

    // reset local pending files
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    galleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    setCoverFile(null);
    setCoverPreview("");
    setGalleryFiles([]);
    setGalleryPreviews([]);

    // reset existing urls
    setExistingCoverUrl("");
    setExistingGalleryUrls([]);

    setSavedMsg("");
    setUploadMsg("");
  }

  function loadIntoForm(p) {
    resetForm();
    setEditingId(p.id);

    setTitle(p.title ?? "");
    setDesc(p.description ?? "");
    setDate(typeof p.date === "string" ? p.date : "");
    setSelectedTags(Array.isArray(p.tags) ? p.tags : []);
    setContent(p.content ?? "");
    setPublished(Boolean(p.published));
    setExistingCoverUrl(p.coverUrl ?? "");
    setExistingGalleryUrls(Array.isArray(p.gallery) ? p.gallery : []);

    setSavedMsg("");
    setUploadMsg("");
  }

  function onPickCover(file) {
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function onPickGallery(files) {
    const arr = Array.from(files || []);
    // revoke old previews
    galleryPreviews.forEach((u) => URL.revokeObjectURL(u));

    setGalleryFiles(arr);
    setGalleryPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSavedMsg("");
    setUploadMsg("");

    if (!title.trim()) return;

    setSaving(true);
    try {
      // 1) Create/update the Firestore doc FIRST to get an id (for Storage paths)
      //    If editing, we already have editingId
      const basePayload = {
        title: title.trim(),
        description: desc.trim(),
        date: date ? date : null,
        tags: selectedTags,
        content,
        published,
      };

      let postId = editingId;

      if (!postId) {
        postId = await createBlogPost({
          ...basePayload,
          coverUrl: null,
          gallery: [],
        });
      } else {
        // update text fields first
        await updateBlogPost(postId, basePayload);
      }

      // 2) Upload cover if selected
      let finalCoverUrl = existingCoverUrl || null;

      if (coverFile) {
        setUploadMsg("Uploading cover…");
        const name = safeName(coverFile.name);
        finalCoverUrl = await uploadFileAndGetUrl(
          coverFile,
          `blog/${postId}/cover/${Date.now()}-${name}`,
        );
      }

      // 3) Upload gallery if selected (append)
      let finalGallery = Array.isArray(existingGalleryUrls)
        ? [...existingGalleryUrls]
        : [];

      if (galleryFiles.length > 0) {
        setUploadMsg(`Uploading gallery (${galleryFiles.length})…`);
        const uploaded = [];
        for (const f of galleryFiles) {
          const name = safeName(f.name);
          const url = await uploadFileAndGetUrl(
            f,
            `blog/${postId}/gallery/${Date.now()}-${name}`,
          );
          uploaded.push(url);
        }
        finalGallery = [...finalGallery, ...uploaded];
      }

      // 4) Save image urls back into Firestore
      setUploadMsg("Saving post…");
      await updateBlogPost(postId, {
        coverUrl: finalCoverUrl,
        gallery: finalGallery,
      });

      setSavedMsg(editingId ? "Updated." : "Saved.");
      setUploadMsg("");
      resetForm();
      refresh();
    } catch (err) {
      setUploadMsg("");
      console.error(err);
      alert(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // A small derived “what cover should we show”
  const effectiveCoverPreview = coverPreview || existingCoverUrl || "";

  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Blog</h2>
          <p className="text-sm text-gray-700">
            Create & edit blog entries (richtext + cover + gallery).
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
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            published
          </label>
          {/* cover upload */}
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Cover image</label>
            <input
              className="w-full text-sm"
              type="file"
              accept="image/*"
              onChange={(e) => onPickCover(e.target.files?.[0])}
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

          {/* cover preview */}
          {effectiveCoverPreview ? (
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-600 mb-2">Cover preview</div>
              <img
                src={effectiveCoverPreview}
                alt="cover preview"
                className="w-full max-h-64 object-cover rounded-md border"
              />
              {existingCoverUrl && !coverFile ? (
                <div className="mt-2 text-xs text-gray-600">
                  Using existing cover. Pick a file above to replace it.
                </div>
              ) : null}
            </div>
          ) : null}

          {/* gallery upload */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Gallery images</label>
            <input
              className="w-full text-sm"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickGallery(e.target.files)}
            />
            <div className="text-xs text-gray-600">
              Selecting gallery images will upload & append them to existing
              ones.
            </div>
          </div>

          {/* gallery previews */}
          {galleryPreviews.length > 0 || existingGalleryUrls.length > 0 ? (
            <div className="sm:col-span-2 space-y-2">
              <div className="text-xs text-gray-600">
                Gallery preview{" "}
                {existingGalleryUrls.length > 0 && galleryPreviews.length === 0
                  ? "(existing)"
                  : "(pending + existing)"}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingGalleryUrls.map((u, i) => (
                  <img
                    key={`existing-${i}`}
                    src={u}
                    alt="existing gallery"
                    className="aspect-square object-cover rounded border"
                  />
                ))}
                {galleryPreviews.map((u, i) => (
                  <img
                    key={`new-${i}`}
                    src={u}
                    alt="new gallery"
                    className="aspect-square object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          ) : null}
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

        {uploadMsg ? (
          <div className="text-sm text-gray-700">{uploadMsg}</div>
        ) : null}
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
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:cursor-pointer hover:bg-gray-50 ${
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
                    <div>
                      {p.published ? (
                        <span className="text-xs border rounded px-2 py-1 mr-2">
                          published
                        </span>
                      ) : (
                        <span className="text-xs border rounded px-2 py-1 text-gray-500 mr-2">
                          draft
                        </span>
                      )}
                      <span className="text-gray-500">✎</span>
                    </div>
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

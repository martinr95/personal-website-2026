import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createBlogPost, listBlogPosts, updateBlogPost } from "../../lib/blog";
import {
  compressImageFile,
  deleteByPath,
  safeName,
  storagePathFromDownloadUrl,
  uploadBlobAndGetUrl,
} from "../../lib/storageUploads";
import { BLOG_TAGS } from "../../constants/tags";

export default function AdminBlog({ onBack }) {
  // form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [content, setContent] = useState(""); // richtext HTML
  const [selectedTags, setSelectedTags] = useState([]);
  const [published, setPublished] = useState(false);

  // images (pending)
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [galleryFiles, setGalleryFiles] = useState([]); // File[]
  const [galleryPreviews, setGalleryPreviews] = useState([]); // string[]

  // existing saved (editing)
  const [existingCoverUrl, setExistingCoverUrl] = useState("");
  const [existingCoverPath, setExistingCoverPath] = useState(null);

  // gallery objects: [{url, path}]
  const [existingGallery, setExistingGallery] = useState([]);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // list + editing
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // upload progress msg
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

    // pending previews
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    galleryPreviews.forEach((u) => URL.revokeObjectURL(u));

    setCoverFile(null);
    setCoverPreview("");

    setGalleryFiles([]);
    setGalleryPreviews([]);

    // existing
    setExistingCoverUrl("");
    setExistingCoverPath(null);
    setExistingGallery([]);

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
    setExistingCoverPath(p.coverPath ?? null);

    // normalized by blog.js to array of objects
    setExistingGallery(Array.isArray(p.gallery) ? p.gallery : []);
  }

  function onPickCover(file) {
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  // APPEND new gallery images (don’t replace)
  function onPickGallery(files) {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;

    setGalleryFiles((prev) => [...prev, ...arr]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...arr.map((f) => URL.createObjectURL(f)),
    ]);
  }

  // remove a pending (not uploaded yet) gallery image
  function removePendingGalleryAt(index) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => {
      const toRemove = prev[index];
      if (toRemove) URL.revokeObjectURL(toRemove);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function deleteExistingCover() {
    if (!editingId) return;
    if (!existingCoverUrl && !existingCoverPath) return;

    if (!confirm("Delete cover image? This will remove it from storage."))
      return;

    setSaving(true);
    setUploadMsg("Deleting cover…");
    try {
      const path =
        existingCoverPath || storagePathFromDownloadUrl(existingCoverUrl);

      if (path) {
        await deleteByPath(path);
      }

      await updateBlogPost(editingId, {
        coverUrl: null,
        coverPath: null,
      });

      setExistingCoverUrl("");
      setExistingCoverPath(null);
      setSavedMsg("Cover deleted.");
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete cover.");
    } finally {
      setUploadMsg("");
      setSaving(false);
    }
  }

  async function deleteExistingGalleryItem(itemIndex) {
    if (!editingId) return;
    const item = existingGallery[itemIndex];
    if (!item?.url && !item?.path) return;

    if (
      !confirm("Delete this gallery image? This will remove it from storage.")
    )
      return;

    setSaving(true);
    setUploadMsg("Deleting gallery image…");
    try {
      const path = item.path || storagePathFromDownloadUrl(item.url);
      if (path) {
        await deleteByPath(path);
      }

      const nextGallery = existingGallery.filter((_, i) => i !== itemIndex);

      await updateBlogPost(editingId, {
        gallery: nextGallery,
      });

      setExistingGallery(nextGallery);
      setSavedMsg("Gallery image deleted.");
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete gallery image.");
    } finally {
      setUploadMsg("");
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSavedMsg("");
    setUploadMsg("");

    if (!title.trim()) return;

    setSaving(true);
    try {
      // 1) Create/update base fields first to get id
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
          coverPath: null,
          gallery: [],
        });
      } else {
        await updateBlogPost(postId, basePayload);
      }

      // 2) COVER handling:
      // If user selected a new cover, delete old cover (if any) BEFORE uploading new
      let finalCoverUrl = existingCoverUrl || null;
      let finalCoverPath = existingCoverPath || null;

      if (coverFile) {
        setUploadMsg("Compressing cover…");
        const blob = await compressImageFile(coverFile, {
          maxWidth: 2200,
          maxHeight: 2200,
          quality: 0.84,
          mimeType: "image/webp",
        });

        // delete old cover if it exists
        const oldPath =
          existingCoverPath || storagePathFromDownloadUrl(existingCoverUrl);
        if (oldPath) {
          setUploadMsg("Deleting old cover…");
          await deleteByPath(oldPath);
        }

        setUploadMsg("Uploading cover…");
        const name = safeName(coverFile.name).replace(
          /\.(png|jpg|jpeg|webp|gif)$/i,
          "",
        );
        const path = `blog/${postId}/cover/${Date.now()}-${name}.webp`;

        const uploaded = await uploadBlobAndGetUrl(blob, path, "image/webp");
        finalCoverUrl = uploaded.url;
        finalCoverPath = uploaded.path;
      }

      // 3) GALLERY handling:
      // We APPEND new uploads to existing gallery
      let finalGallery = Array.isArray(existingGallery)
        ? [...existingGallery]
        : [];

      if (galleryFiles.length > 0) {
        setUploadMsg(`Uploading gallery (${galleryFiles.length})…`);
        for (const f of galleryFiles) {
          setUploadMsg(`Compressing ${f.name}…`);
          const blob = await compressImageFile(f, {
            maxWidth: 2200,
            maxHeight: 2200,
            quality: 0.82,
            mimeType: "image/webp",
          });

          const base = safeName(f.name).replace(
            /\.(png|jpg|jpeg|webp|gif)$/i,
            "",
          );
          const path = `blog/${postId}/gallery/${Date.now()}-${base}.webp`;

          setUploadMsg(`Uploading ${f.name}…`);
          const uploaded = await uploadBlobAndGetUrl(blob, path, "image/webp");
          finalGallery.push({ url: uploaded.url, path: uploaded.path });
        }
      }

      // 4) Save image fields
      setUploadMsg("Saving post…");
      await updateBlogPost(postId, {
        coverUrl: finalCoverUrl,
        coverPath: finalCoverPath,
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

  const effectiveCoverPreview = coverPreview || existingCoverUrl || "";

  return (
    <div className="space-y-6">
      {/* header */}
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

          {/* cover */}
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Cover image</label>

              {editingId && (existingCoverUrl || existingCoverPath) ? (
                <button
                  type="button"
                  onClick={deleteExistingCover}
                  className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                >
                  Delete cover
                </button>
              ) : null}
            </div>

            <input
              className="w-full text-sm"
              type="file"
              accept="image/*"
              onChange={(e) => onPickCover(e.target.files?.[0])}
            />

            <div className="text-xs text-gray-600">
              Picking a new file will replace the old cover (and delete the old
              file).
            </div>
          </div>

          {/* tags */}
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
            </div>
          ) : null}

          {/* gallery */}
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
              Gallery uploads are appended. Remove any image with the × button.
            </div>
          </div>

          {/* gallery previews */}
          {existingGallery.length > 0 || galleryPreviews.length > 0 ? (
            <div className="sm:col-span-2 space-y-2">
              <div className="text-xs text-gray-600">Gallery</div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {/* existing */}
                {existingGallery.map((item, i) => (
                  <div key={`existing-${i}`} className="relative">
                    <img
                      src={item.url}
                      alt="existing gallery"
                      className="aspect-square object-cover rounded border"
                    />
                    {editingId ? (
                      <button
                        type="button"
                        onClick={() => deleteExistingGalleryItem(i)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center"
                        title="Delete"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}

                {/* pending */}
                {galleryPreviews.map((u, i) => (
                  <div key={`new-${i}`} className="relative">
                    <img
                      src={u}
                      alt="new gallery"
                      className="aspect-square object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingGalleryAt(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* content */}
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

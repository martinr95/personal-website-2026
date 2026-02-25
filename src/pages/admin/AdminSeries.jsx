import { useEffect, useMemo, useState } from "react";
import {
  createSeries,
  deleteSeries,
  listSeries,
  updateSeries,
} from "../../lib/series";
import { slugify } from "../../lib/slug";

export default function AdminSeries({ onBack }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);

  // form
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await listSeries();
      setSeries(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const slugAuto = useMemo(() => slugify(name), [name]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setTagInput("");
    setTags([]);
    setMsg("");
  }

  function loadIntoForm(s) {
    resetForm();
    setEditingId(s.id);
    setName(s.name ?? "");
    setSlug(s.slug ?? "");
    setDescription(s.description ?? "");
    setTags(Array.isArray(s.tags) ? s.tags : []);
  }

  function addTagFromInput() {
    const t = tagInput.trim();
    if (!t) return;
    setTags((prev) => {
      const next = prev.includes(t) ? prev : [...prev, t];
      return next;
    });
    setTagInput("");
  }

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  async function handleSave(e) {
    e.preventDefault();
    setMsg("");

    const n = name.trim();
    if (!n) return;

    const finalSlug = (slug.trim() || slugAuto).trim();
    if (!finalSlug) return;

    setSaving(true);
    try {
      const payload = {
        name: n,
        slug: finalSlug,
        description: description.trim() || null,
        tags,
      };

      if (!editingId) {
        await createSeries(payload);
        setMsg("Series created.");
      } else {
        await updateSeries(editingId, payload);
        setMsg("Series updated.");
      }

      await refresh();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to save series.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        "Delete this series? All blog posts in this series will be unlinked automatically (posts stay).",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await deleteSeries(id);
      await refresh();
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete series.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Series</h2>
          <p className="text-sm text-gray-700">
            Create & manage blog series (Rubriken).
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
      <form onSubmit={handleSave} className="space-y-3 border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            {editingId ? (
              <>
                Editing{" "}
                <span className="font-medium">{name || "(untitled)"}</span>
              </>
            ) : (
              "Create a new series"
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
            <label className="text-sm text-gray-700">Name *</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Japan Diaries"
            />
            <div className="text-xs text-gray-600">
              Auto-slug: <span className="font-mono">{slugAuto || "—"}</span>
            </div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">
              Slug (optional, defaults to auto)
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 font-mono"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. japan-diaries"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Description</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short explanation shown on a series page later…"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm text-gray-700">Series tags</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-md px-3 py-2"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Type tag and press Add"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTagFromInput();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTagFromInput}
                className="px-3 py-2 rounded-md border hover:bg-gray-50"
              >
                Add
              </button>
            </div>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => removeTag(t)}
                    className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                    title="Remove"
                  >
                    {t} <span className="text-gray-400">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-600">No tags yet.</div>
            )}
          </div>
        </div>

        {msg ? <div className="text-sm text-gray-700">{msg}</div> : null}

        <button
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : editingId ? "Update series" : "Create series"}
        </button>
      </form>

      {/* list */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-gray-700">Your series</div>

          <button
            type="button"
            onClick={refresh}
            className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-3 text-sm text-gray-700">Loading…</div>
          ) : series.length === 0 ? (
            <div className="p-3 text-sm text-gray-700">No series yet.</div>
          ) : (
            <ul className="divide-y">
              {series.map((s) => (
                <li key={s.id} className="px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => loadIntoForm(s)}
                      className="text-left flex-1 hover:opacity-80"
                    >
                      <div className="text-sm">
                        <span className="font-medium">{s.name}</span>{" "}
                        <span className="text-gray-400">·</span>{" "}
                        <span className="font-mono text-xs text-gray-600">
                          {s.slug}
                        </span>
                      </div>
                      {s.description ? (
                        <div className="text-xs text-gray-600 mt-1">
                          {s.description}
                        </div>
                      ) : null}
                      {Array.isArray(s.tags) && s.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {s.tags.map((t) => (
                            <span
                              key={t}
                              className="text-xs border rounded px-2 py-1 text-gray-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadIntoForm(s)}
                        className="text-xs border rounded px-2 py-1 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-xs border rounded px-2 py-1 hover:bg-gray-50 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-xs text-gray-600">
          Deleting a series automatically removes the series reference from all
          posts.
        </div>
      </div>
    </div>
  );
}

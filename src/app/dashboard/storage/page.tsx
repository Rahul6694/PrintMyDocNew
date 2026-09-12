"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen, Plus, Upload, FileText } from "lucide-react";

type FileRow = { id: number; category: string; file_name: string; file_size: number; created_at: string };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StoragePage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<FileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/storage");
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files || []);
      setCategories(data.categories || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFiles(fileList: FileList) {
    setUploading(true);
    setError("");
    for (const file of Array.from(fileList)) {
      const form = new FormData();
      form.append("file", file);
      form.append("category", activeCategory || "General");
      const res = await fetch("/api/storage", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    }
    setUploading(false);
    load();
  }

  function newCategory() {
    const name = prompt("New category name");
    if (name?.trim()) setActiveCategory(name.trim());
  }

  async function deleteFile(id: number) {
    await fetch(`/api/storage/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  const visibleFiles = activeCategory ? files.filter((f) => f.category === activeCategory) : files;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Storage</h1>
          <p className="text-base-500 text-sm">Files your shop has uploaded, kept on this server</p>
        </div>
        <div className="flex gap-2">
          <button onClick={newCategory} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus size={14} /> New category
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <Upload size={14} /> {uploading ? "Uploading..." : "Upload files"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <FolderOpen size={15} /> Categories
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-left text-sm px-3 py-2 rounded-lg ${!activeCategory ? "bg-accent-500 text-white" : "hover:bg-base-800"}`}
            >
              All files ({files.length})
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`text-left text-sm px-3 py-2 rounded-lg ${activeCategory === c ? "bg-accent-500 text-white" : "hover:bg-base-800"}`}
              >
                {c} ({files.filter((f) => f.category === c).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
          <div className="card overflow-hidden">
            {loading ? (
              <p className="text-base-500 text-sm p-6">Loading...</p>
            ) : visibleFiles.length === 0 ? (
              <p className="text-base-500 text-sm p-10 text-center">No files uploaded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-base-500 border-b border-base-700/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Uploaded</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFiles.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelected(f)}
                      className={`border-b border-base-700/40 last:border-0 cursor-pointer ${selected?.id === f.id ? "bg-base-800" : ""}`}
                    >
                      <td className="px-4 py-3">{f.file_name}</td>
                      <td className="px-4 py-3 text-base-500">{formatSize(f.file_size)}</td>
                      <td className="px-4 py-3 text-base-500">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFile(f.id);
                          }}
                          className="text-xs text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-5 flex flex-col items-center justify-center text-center">
            {selected ? (
              <>
                <FileText size={28} className="text-accent-400 mb-2" />
                <p className="font-medium text-sm break-all">{selected.file_name}</p>
                <p className="text-xs text-base-500 mt-1">{formatSize(selected.file_size)}</p>
                <a href={`/api/storage/${selected.id}`} className="btn-primary text-xs mt-4 px-3 py-2">
                  Download
                </a>
              </>
            ) : (
              <p className="text-base-500 text-sm">Select a file to preview.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

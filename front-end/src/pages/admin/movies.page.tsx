import React, { useEffect, useState } from "react";
import axiosInstance, { buildMediaSrc } from "../../config/api.config";
import type { Movie } from "../../types/model.type";
import Modal from "../../components/modal.component";
import type { Genre } from "../../types/model.type";

const MoviesAdminPage: React.FC = () => {
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  // CRUD modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [duration, setDuration] = useState<number>(90);
  const [genreIdsStr, setGenreIdsStr] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);

  // preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // State untuk genre
  const [genreList, setGenreList] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [showGenreModal, setShowGenreModal] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/movies", {
        params: { page, per_page: Math.min(50, perPage) },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
      setPage(pag?.page ?? page);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setOverview("");
    setDuration(90);
    setGenreIdsStr("");
    setPosterFile(null);
    setShowModal(true);
  };

  const openEdit = (m: Movie) => {
    setEditing(m);
    setTitle(m.title);
    setOverview(m.overview ?? "");
    setDuration(m.duration ?? 90);
    setGenreIdsStr((m.genre_ids || []).join(","));
    setPosterFile(null);
    setShowModal(true);
  };

  const addGenre = (g: Genre) => {
    setSelectedGenres((prev) =>
      prev.some((x) => x.id === g.id) ? prev : [...prev, g]
    );
  };
  const removeGenre = (id: number) => {
    setSelectedGenres((prev) => prev.filter((g) => g.id !== id));
  };

  const submit = async () => {
    try {
      const genre_ids = selectedGenres.map((g) => g.id);

      if (posterFile) {
        const form = new FormData();
        form.append("title", title);
        form.append("overview", overview);
        form.append("duration", String(duration));
        genre_ids.forEach((gid) => form.append("genre_ids", String(gid)));
        form.append("poster", posterFile);

        if (editing) {
          await axiosInstance.put(`/movies/${editing.id}`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await axiosInstance.post("/movies", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        const payload = {
          title,
          overview,
          duration: Number(duration),
          genre_ids,
        };

        if (editing) {
          await axiosInstance.put(`/movies/${editing.id}`, payload);
        } else {
          await axiosInstance.post("/movies", payload);
        }
      }

      setShowModal(false);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axiosInstance.get("/genres", {
          params: { per_page: 50 },
        });
        const pag = res.data?.data;
        const data: Genre[] = Array.isArray(pag?.data) ? pag.data : [];
        setGenreList(data);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Delete movie?")) return;
    await axiosInstance.delete(`/movies/${id}`);
    fetchList();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Movies</h1>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Math.min(50, Number(e.target.value)));
              setPage(1);
            }}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Movie
          </button>
        </div>
      </div>

      {loading && <div className="text-gray-300">Loading...</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {items.map((m) => {
          const posterSrc = buildMediaSrc(m.poster_url);
          return (
            <div key={m.id} className="bg-gray-800 rounded overflow-hidden">
              <img
                src={posterSrc}
                alt={m.title}
                className="w-full h-56 object-cover"
              />
              <div className="p-3">
                <div className="font-medium text-white mb-2 line-clamp-2">
                  {m.title}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">{m.duration} mins</div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(m)}
                      className="px-2 py-1 bg-yellow-600 rounded text-white"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete movie?")) return;
                        try {
                          await axiosInstance.delete(`/movies/${m.id}`);
                          fetchList();
                        } catch (err) {
                          console.error(err);
                          alert("Delete failed");
                        }
                      }}
                      className="px-2 py-1 bg-red-600 rounded text-white"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Page {page} / {totalPages} — Total: {total}
        </div>

        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Movie modal */}
      <Modal
        open={showModal}
        title={editing ? "Edit Movie" : "Create Movie"}
        onCancel={() => setShowModal(false)}
        onConfirm={submit}
        centerTitle={true}
      >
        <div className="space-y-3">
          <label className="block text-sm text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="input-field"
          />

          <label className="block text-sm text-gray-300">Overview</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="input-field h-24 resize-y"
          />

          <label className="block text-sm text-gray-300">Duration (mins)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input-field w-40"
          />

          <label className="block text-sm text-gray-300">Genres</label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div
                className="input-field flex items-center flex-wrap gap-2 overflow-x-auto min-h-[40px] pr-2"
                style={{ background: "#1e293b" }}
              >
                {selectedGenres.map((g) => (
                  <span
                    key={g.id}
                    className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full"
                  >
                    {g.name}
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-red-400"
                      onClick={() => removeGenre(g.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={selectedGenres.map((g) => g.name).join(", ")}
                disabled
                tabIndex={-1}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                placeholder="Select genres"
                readOnly
              />
            </div>
            <button
              type="button"
              className="px-3 py-2 bg-blue-600 rounded text-white"
              onClick={() => setShowGenreModal(true)}
            >
              Browse
            </button>
          </div>

          <label className="block text-sm text-gray-300">
            Poster (optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="poster-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setPosterFile(f);
                if (f) {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(URL.createObjectURL(f));
                } else {
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(null);
                }
              }}
              className="hidden"
            />
            <label
              htmlFor="poster-input"
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 cursor-pointer select-none"
            >
              Choose File
            </label>
            <div className="text-sm text-gray-300">
              {posterFile?.name ?? "No file chosen"}
            </div>
          </div>

          {previewUrl && (
            <div className="w-full mt-2 justify-center">
              <img
                src={previewUrl}
                alt="Poster preview"
                className="w-28 h-10 object-cover rounded border border-gray-700 cursor-pointer"
                onClick={() => setShowImagePreview(true)}
              />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showImagePreview}
        title="Poster Preview"
        onCancel={() => setShowImagePreview(false)}
        hideDefaultButtons={true}
      >
        {previewUrl && (
          <div className="flex justify-center">
            <img
              src={previewUrl}
              alt="Poster large preview"
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        )}
      </Modal>
      <Modal
        open={showGenreModal}
        title="Select Genres"
        onCancel={() => setShowGenreModal(false)}
        onConfirm={() => setShowGenreModal(false)}
        centerTitle={true}
      >
        <div className="space-y-2">
          {genreList.map((g) => (
            <label key={g.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedGenres.some((sel) => sel.id === g.id)}
                onChange={(e) => {
                  if (e.target.checked) addGenre(g);
                  else removeGenre(g.id);
                }}
              />
              <span>{g.name}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default MoviesAdminPage;

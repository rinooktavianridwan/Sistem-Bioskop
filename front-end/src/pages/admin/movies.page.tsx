import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import type { Movie } from "../../types/model.type";
import Modal from "../../components/modal.component";

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

  const submit = async () => {
    try {
      const genre_ids = genreIdsStr
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

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
          const posterSrc = m.poster_url
            ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, "")}/${
                m.poster_url
              }`
            : "/No-Image-Placeholder.png";
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
      >
        <div className="space-y-3">
          <label className="block text-sm text-gray-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />

          <label className="block text-sm text-gray-300">Overview</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />

          <label className="block text-sm text-gray-300">Duration (mins)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-40 px-3 py-2 bg-gray-800 rounded text-white"
          />

          <label className="block text-sm text-gray-300">
            Genre IDs (comma separated)
          </label>
          <input
            value={genreIdsStr}
            onChange={(e) => setGenreIdsStr(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />

          <label className="block text-sm text-gray-300">
            Poster (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MoviesAdminPage;

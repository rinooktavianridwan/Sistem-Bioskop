import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import type { Schedule } from "../../types/model.type";
import Modal from "../../components/modal.component"; 

const SchedulesAdminPage: React.FC = () => {
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // filters
  const [date, setDate] = useState<string>("");
  const [movieTitle, setMovieTitle] = useState<string>("");
  const [studioId, setStudioId] = useState<number | "">("");
  const [studios, setStudios] = useState<{ id: number; name: string }[]>([]);
  const [movies, setMovies] = useState<{ id: number; title: string }[]>([]);

  // modal CRUD
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [movieId, setMovieId] = useState<number | "">("");
  const [studioSelId, setStudioSelId] = useState<number | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState<number>(75000);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        per_page: Math.min(50, perPage),
      };
      if (date) {
        params.date_from = date;
        params.date_to = date;
      }
      if (movieTitle) params.movie_title = movieTitle;
      if (studioId && studioId !== "") params.studio_id = studioId;

      const res = await axiosInstance.get("/schedules", { params });
      const pag = res.data?.data;
      const data: Schedule[] = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
      setPage(pag?.page ?? page);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudios = async () => {
    try {
      const res = await axiosInstance.get("/studios", {
        params: { per_page: 50 },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setStudios(data);
    } catch (e) {
      console.warn("Failed to load studios", e);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await axiosInstance.get("/movies", {
        params: { per_page: 50 },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setMovies(data);
    } catch (e) {
      console.warn("Failed to load movies", e);
    }
  };

  useEffect(() => {
    fetchStudios();
    fetchMovies();
    // initial list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setMovieId("");
    setStudioSelId("");
    setStartTime("");
    setEndTime("");
    setPrice(75000);
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setMovieId(s.movie_id);
    setStudioSelId(s.studio_id);
    setStartTime(s.start_time.slice(0, 16)); // ISO local
    setEndTime(s.end_time.slice(0, 16));
    setPrice(s.price ?? 0);
    setShowModal(true);
  };

  const submit = async () => {
    try {
      const payload = {
        movie_id: Number(movieId),
        studio_id: Number(studioSelId),
        start_time: startTime,
        end_time: endTime,
        date: startTime ? startTime.slice(0, 10) : undefined,
        price,
      };
      if (editing) {
        await axiosInstance.put(`/schedules/${editing.id}`, payload);
      } else {
        await axiosInstance.post("/schedules", payload);
      }
      setShowModal(false);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, date, movieTitle, studioId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schedules (Admin)</h1>
        <div>
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Schedule
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="bg-gray-800 text-white px-3 py-2 rounded"
          title="Filter by date"
        />

        <input
          type="search"
          placeholder="Search movie title..."
          value={movieTitle}
          onChange={(e) => {
            setMovieTitle(e.target.value);
            setPage(1);
          }}
          className="bg-gray-800 text-white px-3 py-2 rounded"
        />

        <select
          value={studioId}
          onChange={(e) => {
            setStudioId(e.target.value === "" ? "" : Number(e.target.value));
            setPage(1);
          }}
          className="bg-gray-800 text-white px-3 py-2 rounded"
        >
          <option value="">All Studios</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

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
          onClick={() => {
            setDate("");
            setMovieTitle("");
            setStudioId("");
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-700 rounded"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((s) => (
              <div
                key={s.id}
                className="bg-gray-800 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{s.movie?.title ?? "—"}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(s.start_time).toLocaleString()} •{" "}
                    {s.studio?.name ?? "—"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="px-3 py-1 bg-blue-600 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete schedule?")) return;
                      try {
                        await axiosInstance.delete(`/schedules/${s.id}`);
                        fetchList();
                      } catch (e) {
                        console.error(e);
                        alert("Delete failed");
                      }
                    }}
                    className="px-3 py-1 bg-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
        </>
      )}
      <Modal
        open={showModal}
        title={editing ? "Edit Schedule" : "Create Schedule"}
        onCancel={() => setShowModal(false)}
        onConfirm={submit}
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-300">Movie</label>
          <select
            value={String(movieId)}
            onChange={(e) =>
              setMovieId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full bg-gray-800 text-white px-3 py-2 rounded"
          >
            <option value="">Select movie</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <label className="text-sm text-gray-300">Studio</label>
          <select
            value={String(studioSelId)}
            onChange={(e) =>
              setStudioSelId(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
            className="w-full bg-gray-800 text-white px-3 py-2 rounded"
          >
            <option value="">Select studio</option>
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="text-sm text-gray-300">Start (ISO)</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded"
          />
          <label className="text-sm text-gray-300">End (ISO)</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded"
          />
          <label className="text-sm text-gray-300">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-40 bg-gray-800 text-white px-3 py-2 rounded"
          />
        </div>
      </Modal>
    </div>
  );
};

export default SchedulesAdminPage;

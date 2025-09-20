import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import Modal from "../../components/modal.component";
import type { Movie } from "../../types/model.type";

interface Promo {
  id: number;
  name: string;
  code: string;
  is_active: boolean;

  description?: string;
  discount_type?: "percentage" | "fixed_amount";
  discount_value?: number;
  min_tickets?: number;
  max_discount?: number | null;
  valid_from?: string;
  valid_until?: string;
  movie_ids?: number[];
}

const PromosAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Promo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string>("");

  // modal CRUD
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);

  // form state (numeric inputs kept as strings for UX)
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [minTickets, setMinTickets] = useState<number>(1);
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [movieIdsStr, setMovieIdsStr] = useState<string>("");

  // State untuk movie
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [showMovieModal, setShowMovieModal] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axiosInstance.get("/movies", {
          params: { per_page: 50 },
        });
        const pag = res.data?.data;
        const data: Movie[] = Array.isArray(pag?.data) ? pag.data : [];
        setMovieList(data);
      } catch (err) {
        console.error("Failed to fetch movies", err);
      }
    };
    fetchMovies();
  }, []);

  const addMovie = (m: Movie) => {
    setSelectedMovies((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [...prev, m]
    );
  };
  const removeMovie = (id: number) => {
    setSelectedMovies((prev) => prev.filter((m) => m.id !== id));
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setIsActive(true);
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinTickets(1);
    setMaxDiscount("");
    setValidFrom("");
    setValidUntil("");
    setMovieIdsStr("");
    setEditing(null);
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/promos", {
        params: { page, per_page: Math.min(50, perPage) },
      });
      const pag = res.data?.data;
      const data: Promo[] = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
      setPage(pag?.page ?? page);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load promos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditing(p);

    setName(p.name);
    setCode(p.code);
    setIsActive(p.is_active);
    setDescription(p.description ?? "");
    setDiscountType(p.discount_type ?? "percentage");
    setDiscountValue(
      p.discount_value !== undefined && p.discount_value !== null
        ? String(p.discount_value)
        : ""
    );
    setMinTickets(p.min_tickets ?? 1);
    setMaxDiscount(
      p.max_discount !== undefined && p.max_discount !== null
        ? String(p.max_discount)
        : ""
    );
    setValidFrom(p.valid_from ? String(p.valid_from).slice(0, 16) : "");
    setValidUntil(p.valid_until ? String(p.valid_until).slice(0, 16) : "");
    setMovieIdsStr((p.movie_ids || []).join(","));
    setShowModal(true);
  };

  const submit = async () => {
    try {
      const payload: Record<string, unknown> = {
        name,
        code,
        description: description || undefined,
        discount_type: discountType,
        discount_value: Number(discountValue || 0),
        min_tickets: Number(minTickets) || 0,
        movie_ids: selectedMovies.map((m) => m.id),
        max_discount:
          discountType === "fixed_amount"
            ? null
            : maxDiscount === ""
            ? undefined
            : Number(maxDiscount),
        is_active: isActive,
      };

      if (validFrom) payload.valid_from = new Date(validFrom).toISOString();
      if (validUntil) payload.valid_until = new Date(validUntil).toISOString();

      const mids = movieIdsStr
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
      if (mids.length) payload.movie_ids = mids;

      if (editing) {
        await axiosInstance.put(`/promos/${editing.id}`, payload);
      } else {
        await axiosInstance.post("/promos", payload);
      }
      setShowModal(false);
      resetForm();
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promos</h1>
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
            Create Promo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : (
        <div>
          <div className="space-y-3">
            {items.map((p) => (
              <div
                key={p.id}
                className="bg-gray-800 p-3 rounded flex justify-between items-center"
              >
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">
                    {p.name} — {p.code}
                  </div>
                  <div className="text-sm text-gray-400">
                    {p.is_active ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="px-2 py-1 bg-yellow-600 rounded text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete promo?")) return;
                      try {
                        await axiosInstance.delete(`/promos/${p.id}`);
                        fetchList();
                      } catch (err) {
                        console.error(err);
                        setError("Delete failed");
                      }
                    }}
                    className="px-2 py-1 bg-red-600 rounded text-white"
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
        </div>
      )}

      <Modal
        open={showModal}
        title={editing ? "Edit Promo" : "Create Promo"}
        onCancel={() => {
          setShowModal(false);
          resetForm();
        }}
        onConfirm={submit}
        centerTitle={true}
      >
        <div className="space-y-3">
          <label className="block text-sm text-gray-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="input-field w-full"
          />

          <label className="block text-sm text-gray-300">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="input-field w-full"
          />

          <label className="block text-sm text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field w-full h-24 resize-y"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(
                    e.target.value as "percentage" | "fixed_amount"
                  )
                }
                className="input-field w-full"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-300">
                Discount Value
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={discountValue}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  const sanitized = raw.replace(/^0+(?=\d)/, "");
                  setDiscountValue(sanitized);
                }}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-300">Min Tickets</label>
              <input
                type="number"
                value={minTickets}
                onChange={(e) => setMinTickets(Number(e.target.value))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">
                Max Discount
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={maxDiscount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  const sanitized = raw.replace(/^0+(?=\d)/, "");
                  setMaxDiscount(sanitized);
                }}
                className="input-field w-full"
                placeholder={
                  discountType === "fixed_amount" ? "null for fixed amount" : ""
                }
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300">Valid From</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Valid Until</label>
              <input
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          <label className="block text-sm text-gray-300">
            Movies (optional)
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div
                className="input-field flex items-center flex-wrap gap-2 overflow-x-auto min-h-[40px] pr-2"
                style={{ background: "#1e293b" }}
              >
                {selectedMovies.map((m) => (
                  <span
                    key={m.id}
                    className="flex items-center bg-gray-700 text-white px-3 py-1 rounded-full"
                  >
                    {m.title}
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-red-400"
                      onClick={() => removeMovie(m.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={selectedMovies.map((m) => m.title).join(", ")}
                disabled
                tabIndex={-1}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                placeholder="Select movies"
                readOnly
              />
            </div>
            <button
              type="button"
              className="px-3 py-2 bg-blue-600 rounded text-white"
              onClick={() => setShowMovieModal(true)}
            >
              Browse
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{" "}
            Active
          </label>
        </div>
      </Modal>
      <Modal
        open={showMovieModal}
        title="Select Movies"
        onCancel={() => setShowMovieModal(false)}
        onConfirm={() => setShowMovieModal(false)}
        centerTitle={true}
      >
        <div className="space-y-2">
          {movieList.map((m) => (
            <label key={m.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedMovies.some((sel) => sel.id === m.id)}
                onChange={(e) => {
                  if (e.target.checked) addMovie(m);
                  else removeMovie(m.id);
                }}
              />
              <span>{m.title}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default PromosAdminPage;

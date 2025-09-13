import React, { useEffect, useState } from "react";
import axiosInstance from "../../../config/api.config";
import Modal from "../../../components/modal.component";

interface Facility {
  id: number;
  name: string;
}

const FacilitiesPage: React.FC = () => {
  const [items, setItems] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [name, setName] = useState("");
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/facilities", {
        params: { page, per_page: Math.min(50, perPage) },
      });
      const pag = res.data?.data;
      const data: Facility[] = Array.isArray(pag?.data)
        ? (pag.data as Facility[])
        : [];
      const unique = Array.from(
        new Map(data.map((d: Facility) => [d.id, d])).values()
      );
      setItems(unique);
      setPage(pag?.page ?? page);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load facilities");
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
    setName("");
    setShowModal(true);
  };

  const openEdit = (f: Facility) => {
    setEditing(f);
    setName(f.name);
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await axiosInstance.put(`/facilities/${editing.id}`, { name });
      } else {
        await axiosInstance.post("/facilities", { name });
      }
      setShowModal(false);
      fetchList();
    } catch (err) {
      console.error(err);
      setError("Operation failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete facility?")) return;
    try {
      await axiosInstance.delete(`/facilities/${id}`);
      fetchList();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Facilities</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1); // reset page when perPage changes
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
            Create Facility
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="bg-gray-800 p-3 rounded flex justify-between items-center"
              >
                <div>{i.name}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(i)}
                    className="px-2 py-1 bg-yellow-600 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(i.id)}
                    className="px-2 py-1 bg-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
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
        title={editing ? "Edit Facility" : "Create Facility"}
        onCancel={() => setShowModal(false)}
        onConfirm={submit}
      >
        <div className="space-y-3">
          <label className="block text-sm text-gray-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />
        </div>
      </Modal>

      {error && <div className="mt-4 text-red-400">{error}</div>}
    </div>
  );
};

export default FacilitiesPage;

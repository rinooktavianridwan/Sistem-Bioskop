import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import Modal from "../../components/modal.component";

interface Promo {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
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
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/promos", {
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
    setName("");
    setCode("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditing(p);
    setName(p.name);
    setCode(p.code);
    setIsActive(p.is_active);
    setShowModal(true);
  };

  const submit = async () => {
    try {
      const payload = { name, code, is_active: isActive };
      if (editing) {
        await axiosInstance.put(`/promos/${editing.id}`, payload);
      } else {
        await axiosInstance.post("/promos", payload);
      }
      setShowModal(false);
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
          <label className="block text-sm text-gray-300">Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded text-white"
          />
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
    </div>
  );
};

export default PromosAdminPage;

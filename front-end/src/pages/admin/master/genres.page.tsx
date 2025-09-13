import React, { useEffect, useState } from "react";
import axiosInstance from "../../../config/api.config";
import Modal from "../../../components/modal.component";

interface Genre {
  id: number;
  name: string;
}

const GenresPage: React.FC = () => {
  const [items, setItems] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Genre | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/genres", {
        params: { per_page: 100 },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load genres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setShowModal(true);
  };
  const openEdit = (g: Genre) => {
    setEditing(g);
    setName(g.name);
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await axiosInstance.put(`/genres/${editing.id}`, { name });
      } else {
        await axiosInstance.post("/genres", { name });
      }
      setShowModal(false);
      fetchList();
    } catch (err) {
      console.error(err);
      setError("Operation failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete genre?")) return;
    try {
      await axiosInstance.delete(`/genres/${id}`);
      fetchList();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Genres</h1>
        <div>
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Genre
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
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
      )}

      <Modal
        open={showModal}
        title={editing ? "Edit Genre" : "Create Genre"}
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

export default GenresPage;

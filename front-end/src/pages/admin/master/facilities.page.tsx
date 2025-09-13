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

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/facilities", {
        params: { per_page: 100 },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load facilities");
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
        <div>
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

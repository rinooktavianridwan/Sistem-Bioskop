import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import { Link } from "react-router-dom";

interface Promo {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

const PromosAdminPage: React.FC = () => {
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/promos", {
        params: { per_page: 50 },
      });
      const pag = res.data?.data;
      const data = Array.isArray(pag?.data) ? pag.data : [];
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promos</h1>
        <div>
          <Link
            to="/admin/promos/create"
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Promo
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="bg-gray-800 p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">
                  {p.name} — {p.code}
                </div>
                <div className="text-sm text-gray-400">
                  {p.is_active ? "Active" : "Inactive"}
                </div>
              </div>
              <div>
                <Link
                  to={`/admin/promos/${p.id}`}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromosAdminPage;

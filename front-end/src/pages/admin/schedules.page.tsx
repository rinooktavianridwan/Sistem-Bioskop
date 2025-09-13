import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import { Link } from "react-router-dom";
import type { Schedule } from "../../types/model.type";

const SchedulesAdminPage: React.FC = () => {
  const [items, setItems] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/schedules", {
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
        <h1 className="text-2xl font-bold">Schedules</h1>
        <div>
          <Link
            to="/admin/schedules/create"
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Schedule
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={s.id}
              className="bg-gray-800 p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{s.movie?.title ?? "—"}</div>
                <div className="text-sm text-gray-400">
                  {new Date(s.start_time).toLocaleString()}
                </div>
              </div>
              <div>
                <Link
                  to={`/admin/schedules/${s.id}`}
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

export default SchedulesAdminPage;

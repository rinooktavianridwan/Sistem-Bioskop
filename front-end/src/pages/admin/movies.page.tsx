import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import { Link } from "react-router-dom";
import type { Movie } from "../../types/model.type";

const MoviesAdminPage: React.FC = () => {
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/movies", {
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
        <h1 className="text-2xl font-bold">Movies</h1>
        <div>
          <Link
            to="/admin/movies/create"
            className="px-3 py-2 bg-blue-600 rounded"
          >
            Create Movie
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="bg-gray-800 p-3 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm text-gray-400">{m.duration} mins</div>
              </div>
              <div>
                <Link
                  to={`/admin/movies/${m.id}`}
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

export default MoviesAdminPage;

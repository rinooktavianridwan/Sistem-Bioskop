import React, { useEffect, useState } from "react";
import axiosInstance, { buildMediaSrc } from "../../config/api.config";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  is_admin: boolean;
  created_at?: string;
}

const API_URL = ((import.meta.env.VITE_API_URL as string) || "").replace(
  /\/$/,
  ""
);

const UsersAdminPage: React.FC = () => {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/users", {
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
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const toggleAdmin = async (u: AdminUser) => {
    if (
      !confirm(
        `${u.is_admin ? "Revoke admin from" : "Promote to admin"} ${u.name}?`
      )
    )
      return;
    try {
      // backend requires Name and Email in update request — include them
      const payload = {
        name: u.name,
        email: u.email,
        is_admin: !u.is_admin,
      };
      await axiosInstance.put(`/users/${u.id}`, payload);
      fetchList();
    } catch (err: unknown) {
      console.error(err);
      // try to show backend message if available
      const msg = (err as any)?.response?.data?.message ?? "Operation failed";
      alert(msg);
      setError(typeof msg === "string" ? msg : "Operation failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete user?")) return;
    try {
      await axiosInstance.delete(`/users/${id}`);
      fetchList();
    } catch (err) {
      console.error(err);
      setError("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
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
        </div>
      </div>

      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : error ? (
        <div className="text-red-400 mb-4">{error}</div>
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((u) => (
              <div
                key={u.id}
                className="bg-gray-800 p-3 rounded flex items-center gap-4"
              >
                <img
                  src={buildMediaSrc(u.avatar)}
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover border border-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {u.name}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {u.email}
                  </div>
                </div>
                <div className="text-sm text-gray-300 mr-4">
                  {u.is_admin ? "Admin" : "User"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAdmin(u)}
                    className="px-3 py-1 bg-indigo-600 rounded text-white"
                  >
                    {u.is_admin ? "Demote" : "Promote"}
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    className="px-3 py-1 bg-red-600 rounded text-white"
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
    </div>
  );
};

export default UsersAdminPage;

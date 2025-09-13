import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  const [masterOpen, setMasterOpen] = React.useState(true);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 text-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <div className="text-sm text-gray-400">/admin</div>
        </div>

        <nav className="space-y-2">
          <div>
            <button
              onClick={() => setMasterOpen((s) => !s)}
              className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-800"
            >
              <span>Data Master</span>
              <span className="text-gray-400">{masterOpen ? "▾" : "▸"}</span>
            </button>

            {masterOpen && (
              <div className="mt-2 ml-3 space-y-1">
                <NavLink
                  to="master/facilities"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive ? "bg-blue-700 text-white" : "hover:bg-gray-800"
                    }`
                  }
                >
                  Facilities
                </NavLink>
                <NavLink
                  to="master/genres"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive ? "bg-blue-700 text-white" : "hover:bg-gray-800"
                    }`
                  }
                >
                  Genres
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="movies"
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-blue-700 text-white" : "hover:bg-gray-800"
              }`
            }
          >
            Movies
          </NavLink>
          <NavLink
            to="promos"
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-blue-700 text-white" : "hover:bg-gray-800"
              }`
            }
          >
            Promos
          </NavLink>
          <NavLink
            to="schedules"
            className={({ isActive }) =>
              `block px-3 py-2 rounded ${
                isActive ? "bg-blue-700 text-white" : "hover:bg-gray-800"
              }`
            }
          >
            Schedules
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-slate-900 text-white">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

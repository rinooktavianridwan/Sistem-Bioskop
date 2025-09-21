import React, { useEffect, useState } from "react";
import axiosInstance from "../../config/api.config";
import { useAuth } from "../../contexts/useAuth.hook";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const submit = async () => {
    setLoading(true);
    setMsg("");
    try {
      // 1) update profile fields (no is_admin)
      const payload: Record<string, unknown> = { name, email };
      if (password) payload.password = password;
      await axiosInstance.put("/users/my", payload);

      // 2) upload avatar if any
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        // allow browser set boundary; avoid global forced Content-Type
        await axiosInstance.put("/users/upload-avatar", form, {
          headers: { "Content-Type": undefined as unknown as string },
        });
      }

      // optimistic update to session storage and reload to reflect changes
      try {
        const raw = sessionStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.name = name;
          parsed.email = email;
          // avatar may be returned by backend, but if not, keep existing
          sessionStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }

      setMsg("Profile updated");
      // reload to refresh UI where necessary
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error(err);
      setMsg("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

        <div className="card p-6 text-white bg-gray-900 rounded">
          <div className="flex flex-col items-center mb-6">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
              <img
                src={previewUrl ?? user?.avatar ?? "/No-Image-Placeholder.png"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <label className="mt-2 inline-flex items-center px-3 py-1 bg-gray-700 rounded text-sm cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAvatarFile(f);
                  if (f) {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(URL.createObjectURL(f));
                  } else {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }
                }}
                className="hidden"
              />
              Update Avatar
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-gray-300">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
            />

            <label className="block text-sm text-gray-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
            />

            <label className="block text-sm text-gray-300">
              New Password (leave blank to keep)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
            />

            <div className="flex items-center justify-between">
              <div className="text-sm text-green-400">{msg}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAvatarFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-3 py-2 bg-gray-700 rounded"
                >
                  Reset Avatar
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 rounded text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Profile"}
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500"
                  >
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

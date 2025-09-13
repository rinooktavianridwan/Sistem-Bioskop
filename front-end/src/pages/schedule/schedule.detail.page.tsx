import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../config/api.config";
import { useAuth } from "../../contexts/useAuth.hook";
import Modal from "../../components/modal.component";
import type {
  Schedule as ScheduleType,
  Movie,
  Facility,
} from "../../types/model.type";

const API_URL = ((import.meta.env.VITE_API_URL as string) || "").replace(
  /\/$/,
  ""
);
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ScheduleDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const movieQuery = searchParams.get("movie") ?? "";
  const dateQuery =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchListForMovie = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/schedules", {
          params: {
            page: 1,
            per_page: 100,
            movie_title: movieQuery || undefined,
            date_from: dateQuery,
            date_to: dateQuery,
          },
        });
        const pag = res.data?.data;
        const items: ScheduleType[] = Array.isArray(pag?.data) ? pag.data : [];
        setSchedules(items);
      } catch (err) {
        console.error(err);
        setError("Failed to load schedules for this movie/date");
      } finally {
        setLoading(false);
      }
    };

    fetchListForMovie();
  }, [movieQuery, dateQuery]);

  const groupedByStudio = useMemo(() => {
    type StudioEntry = {
      studioName: string;
      facilities: string[];
      times: ScheduleType[];
    };
    const map = new Map<number, StudioEntry>();
    schedules.forEach((s) => {
      const studioId = s.studio?.id ?? s.studio_id;
      const name = s.studio?.name ?? `Studio ${studioId}`;
      const facilities = (s.studio?.facilities ?? []) as Facility[];
      const facilityNames = facilities.map((f) => f.name);
      if (!map.has(studioId)) {
        map.set(studioId, {
          studioName: name,
          facilities: facilityNames,
          times: [],
        });
      }
      map.get(studioId)!.times.push(s);
    });
    Array.from(map.values()).forEach((entry) => {
      entry.times.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
    return Array.from(map.entries()).map(([studioId, v]) => ({
      studioId,
      ...v,
    }));
  }, [schedules]);

  const movie: Movie | null = schedules[0]?.movie ?? null;

  if (loading) return <div className="text-gray-300 p-6">Loading...</div>;
  if (error) return <div className="text-red-400 p-6">{error}</div>;
  if (!movie)
    return <div className="text-gray-300 p-6">No schedules found</div>;

  const poster = movie.poster_url
    ? `${API_URL}/${movie.poster_url}`
    : "/No-Image-Placeholder.png";

  const onBook = () => {
    if (!selectedScheduleId) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/orders/new?schedule_id=${selectedScheduleId}`);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex gap-6">
        <div className="w-1/3">
          <img
            src={poster}
            alt={movie.title}
            className="w-full rounded-lg object-cover"
          />
        </div>
        <div className="flex-1 text-white">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <div className="text-sm text-gray-400 mb-4">
            {movie.duration} minutes •{" "}
            {movie.genres?.map((g) => g.name).join(", ")}
          </div>
          <p className="text-gray-300 mb-6">{movie.overview}</p>

          <div className="space-y-6">
            {groupedByStudio.map((st) => (
              <div key={st.studioId} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {st.studioName}
                    </div>
                    <div className="text-sm text-gray-400">
                      Facilities: {(st.facilities || []).join(", ") || "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {st.times.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScheduleId(s.id)}
                      className={`px-4 py-2 rounded text-sm ${
                        selectedScheduleId === s.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      }`}
                    >
                      {formatTime(s.start_time)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              disabled={!selectedScheduleId}
              onClick={onBook}
              className={`px-6 py-3 rounded font-medium ${
                selectedScheduleId
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Pesan Sekarang
            </button>
          </div>
        </div>

        <Modal
          open={showLoginModal}
          title="Harap Login"
          message="Anda harus login untuk melakukan pemesanan. Ingin pergi ke halaman login sekarang?"
          confirmText="Ke Login"
          cancelText="Batal"
          onConfirm={() => {
            setShowLoginModal(false);
            navigate("/login");
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      </div>
    </div>
  );
};

export default ScheduleDetail;

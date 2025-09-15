import React, { useEffect, useState } from 'react';
import axiosInstance, { buildMediaSrc } from '../../config/api.config';
import { Calendar } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Schedule as ScheduleType, Movie } from '../../types/model.type';

const formatISODate = (d: Date) => d.toISOString().slice(0, 10);

interface MovieGroup {
  movie: Movie;
  totalShowtimes: number;
  poster?: string;
}

const Schedules: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = Number(searchParams.get('page') ?? '1');
  const initialPerPage = Number(searchParams.get('per_page') ?? '5');
  const initialDate = searchParams.get('date') ?? formatISODate(new Date());
  const initialMovie = searchParams.get('movie') ?? '';

  const [groups, setGroups] = useState<MovieGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState<number>(initialPage);
  const [perPage, setPerPage] = useState<number>(initialPerPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState<string>(initialDate);
  const [movieQuery, setMovieQuery] = useState<string>(initialMovie);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('page', String(page));
    sp.set('per_page', String(perPage));
    sp.set('date', date);
    if (movieQuery) sp.set('movie', movieQuery); else sp.delete('movie');
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, date, movieQuery]);

  useEffect(() => {
    const p = Number(searchParams.get('page') ?? '1');
    const pp = Number(searchParams.get('per_page') ?? '5');
    const d = searchParams.get('date') ?? formatISODate(new Date());
    const mq = searchParams.get('movie') ?? '';
    if (p !== page) setPage(p);
    if (pp !== perPage) setPerPage(pp);
    if (d !== date) setDate(d);
    if (mq !== movieQuery) setMovieQuery(mq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/schedules', {
        params: { page, per_page: perPage, date_from: date, date_to: date, movie_title: movieQuery || undefined },
      });
      const pag = res.data?.data;
      const items: ScheduleType[] = Array.isArray(pag?.data) ? pag.data : [];

      const movieMap = new Map<number, { movie: Movie; totalShowtimes: number; poster?: string }>();

      items.forEach(s => {
        const m = s.movie as Movie | undefined;
        if (!m) return;
        if (!movieMap.has(m.id)) {
          movieMap.set(m.id, { movie: m, totalShowtimes: 0, poster: m.poster_url ?? undefined });
        }
        const entry = movieMap.get(m.id)!;
        entry.totalShowtimes += 1;
      });

      const groupedArray: MovieGroup[] = Array.from(movieMap.values()).map(v => ({
        movie: v.movie,
        totalShowtimes: v.totalShowtimes,
        poster: v.poster,
      }));

      setGroups(groupedArray);
      setPage(pag?.page ?? 1);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, date, movieQuery]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Calendar className="mr-3 h-7 w-7" /> Schedules
        </h1>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={date}
            onChange={e => {
              setDate(e.target.value);
              setPage(1);
            }}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <input
            type="search"
            placeholder="Search movie..."
            value={movieQuery}
            onChange={e => { setMovieQuery(e.target.value); setPage(1); }}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <label className="text-sm text-gray-300">Per page</label>
          <select
            value={perPage}
            onChange={e => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            {[5, 10, 20].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-gray-300">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map(g => {
          const posterSrc = buildMediaSrc(g.poster);
          const detailQuery = new URLSearchParams({ movie: g.movie.title, date });
          return (
            <Link
              key={g.movie.id}
              to={`/schedule/detail?${detailQuery.toString()}`}
              className="block bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="md:flex">
                <div className="md:w-1/3 w-full h-56 md:h-auto">
                  <img src={posterSrc} alt={g.movie.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 md:flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{g.movie.title}</h3>
                  <div className="text-sm text-gray-400 mb-4">Date: {new Date(date).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-300">Total showtimes: <span className="font-medium text-white">{g.totalShowtimes}</span></div>
                  <p className="text-sm text-gray-400 mt-3 line-clamp-3">{g.movie.overview ?? ''}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Page {page} / {totalPages} — Total: {total}
        </div>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Schedules;

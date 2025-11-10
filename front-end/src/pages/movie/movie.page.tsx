import React, { useEffect, useState } from 'react';
import axiosInstance, { buildMediaSrc } from "../../config/api.config";
import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Movie as MovieType } from '../../types/model.type';

const Movies: React.FC = () => {
  const [movies, setMovies] = useState<MovieType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/movies', {
        params: { page, per_page: perPage },
      });
      const pag = res.data?.data;
      const items = Array.isArray(pag?.data) ? pag.data : [];
      setMovies(items);
      setPage(pag?.page ?? 1);
      setPerPage(pag?.per_page ?? perPage);
      setTotalPages(pag?.total_page ?? 1);
      setTotal(pag?.total ?? 0);
    } catch {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Film className="mr-2 h-6 w-6" /> Movies
        </h1>
        {/* Removed search here because backend movie filter not implemented */}
      </div>

      {loading && <div className="text-gray-300">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-400">Total: {total}</div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-300">Per page</label>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="bg-gray-800 text-white text-sm px-2 py-1 rounded"
          >
            {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {movies.map(m => {
          const posterSrc = buildMediaSrc(m.poster_url);
          return (
            <Link key={m.id} to={`/movies/${m.id}`} className="flex flex-col items-center group">
              <div className="w-full aspect-[2/3] bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                <img src={posterSrc} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              {/* VULNERABLE XSS - Testing purposes only */}
              {/* <div 
                className="mt-2 text-sm text-white text-center font-medium"
                dangerouslySetInnerHTML={{ __html: m.title }}
              /> */}
              {/* SAFE VERSION - commented out for testing */}
              <div className="mt-2 text-sm text-white text-center font-medium">{m.title}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-400">Page {page} / {totalPages}</div>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Movies;

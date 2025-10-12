import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance, { buildMediaSrc } from "../../config/api.config";
import type { Movie as MovieType } from '../../types/model.type';
import { ArrowLeft } from 'lucide-react';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<MovieType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/movies/${id}`);
        const data = res.data?.data ?? res.data;
        setMovie(data);
      } catch {
        setError('Failed to load movie');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMovie();
  }, [id]);

  if (loading) return <div className="text-gray-300">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!movie) return <div className="text-gray-300">Movie not found</div>;

  const posterSrc = buildMediaSrc(movie.poster_url);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link to="/movies" className="inline-flex items-center text-sm text-gray-300 mb-4">
        <ArrowLeft className="mr-2" /> Back to movies
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <img src={posterSrc} alt={movie.title} className="w-full rounded" />
        </div>
        <div className="md:w-2/3 text-white">
          {/* VULNERABLE XSS - Testing purposes only */}
          <h1 
            className="text-3xl font-bold mb-2"
            dangerouslySetInnerHTML={{ __html: movie.title }}
          />
          {/* SAFE VERSION - commented out for testing */}
          {/* <h1 className="text-3xl font-bold mb-2">{movie.title}</h1> */}
          
          <div className="text-sm text-gray-400 mb-4">{(movie.genres || []).map(g => g.name).join(', ')}</div>
          
          {/* VULNERABLE XSS - Testing purposes only */}
          <p 
            className="text-gray-300 mb-4"
            dangerouslySetInnerHTML={{ __html: movie.overview }}
          />
          {/* SAFE VERSION - commented out for testing */}
          {/* <p className="text-gray-300 mb-4">{movie.overview}</p> */}
          
          <div className="text-gray-400">Duration: {movie.duration} minutes</div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;

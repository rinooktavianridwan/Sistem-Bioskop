import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Calendar, Star } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-purple-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to Cinema App
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Book your favorite movies and enjoy the ultimate cinema experience. 
              Discover the latest blockbusters and classic films.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/movies"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <Film className="mr-2 h-5 w-5" />
                Browse Movies
              </Link>
              <Link
                to="/schedules"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <Calendar className="mr-2 h-5 w-5" />
                View Schedules
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Cinema?</h2>
            <p className="text-gray-400 text-lg">Experience entertainment like never before</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 card">
              <Film className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Latest Movies</h3>
              <p className="text-gray-400">
                Watch the newest blockbusters and indie films in high quality.
              </p>
            </div>
            
            <div className="text-center p-6 card">
              <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Easy Booking</h3>
              <p className="text-gray-400">
                Book your tickets online with our simple and secure booking system.
              </p>
            </div>
            
            <div className="text-center p-6 card">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Premium Experience</h3>
              <p className="text-gray-400">
                Enjoy comfortable seating and state-of-the-art sound systems.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Home() {
  const { isAuthenticated } = useAuth();
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tournamentsData, courtsData, clubsData] = await Promise.all([
        api.getActiveTournaments(),
        api.getCourts({ limit: 6 }),
        api.getClubs(),
      ]);
      setActiveTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setClubs(clubsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const features = [
    {
      icon: '🏟️',
      title: 'Book Courts',
      description: 'Find and book available tennis courts near you. Choose from clay, grass, or hard courts.'
    },
    {
      icon: '🏆',
      title: 'Tournaments',
      description: 'Compete in tournaments, climb the leaderboard, and prove you\'re the best.'
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor your wins, losses, and ranking points. Improve your game over time.'
    },
    {
      icon: '🎓',
      title: 'Coaching',
      description: 'Book sessions with professional coaches to improve your skills.'
    },
    {
      icon: '👥',
      title: 'Community',
      description: 'Connect with other tennis enthusiasts and find playing partners.'
    },
    {
      icon: '🎯',
      title: 'Rankings',
      description: 'Compete for the top spot in our global player rankings.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://i.pinimg.com/1200x/42/37/eb/4237eb6b88b15f9e30cbe4d1ff991774.jpg)'
            }}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-[#CCFF00] rounded-full opacity-30"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-[#CCFF00] rounded-full opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <div className="text-center animate-fadeIn">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-8 backdrop-blur-sm border-2 border-white/30">
              <span className="text-5xl">🎾</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
              {clubs.length > 0 ? clubs[0].name : 'Play Tennis Like a Pro'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
              Book courts, join tournaments, track your progress, and compete with players worldwide
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/courts"
                className="inline-flex items-center bg-white text-[#2E7D32] hover:bg-gray-100 text-lg px-8 py-4 shadow-xl rounded-xl font-semibold transition-all hover:scale-105 backdrop-blur-sm"
              >
                Book a Court
                <span className="ml-2">→</span>
              </Link>
              <Link
                to="/tournaments"
                className="inline-flex items-center bg-[#2E7D32] text-white border-2 border-white/30 hover:bg-[#1B5E20] text-lg px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 backdrop-blur-sm"
              >
                Join Tournament
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Play
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From booking courts to tracking your progress, we've got you covered
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card p-8 group hover:border-[#2E7D32] border-2 border-transparent"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-[#2E7D32] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courts Preview */}
      {courts.length > 0 && (
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Available Courts</h2>
                <p className="text-gray-600">Find your perfect court</p>
              </div>
              <Link 
                to="/courts" 
                className="btn btn-outline mt-4 md:mt-0"
              >
                View All Courts
                <span className="ml-2">→</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courts.map((court) => (
                <div key={court.id} className="card group">
                  <div className="h-48 bg-gradient-to-br from-[#2E7D32] to-[#4CAF50] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 court-pattern opacity-30"></div>
                    <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform">🎾</span>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-[#2E7D32]">
                        {court.is_indoor ? '🏠 Indoor' : '☀️ Outdoor'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{court.name}</h3>
                      <span className={`badge ${court.is_available ? 'badge-success' : 'badge-error'}`}>
                        {court.is_available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-[#2E7D32] rounded-full mr-2"></span>
                        {court.court_type}
                      </span>
                      {court.location && (
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {court.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-2xl font-bold text-[#2E7D32]">
                        {court.price_per_hour} KES
                        <span className="text-sm font-normal text-gray-500">/hour</span>
                      </span>
                      <Link
                        to="/courts"
                        className="btn btn-primary py-2 px-4 text-sm"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tournaments Preview */}
      {activeTournaments.length > 0 && (
        <div className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Active Tournaments</h2>
                <p className="text-gray-600">Compete and win prizes</p>
              </div>
              <Link 
                to="/tournaments" 
                className="btn btn-outline mt-4 md:mt-0"
              >
                View All Tournaments
                <span className="ml-2">→</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTournaments.map((tournament) => (
                <div key={tournament.id} className="card p-6 border-l-4 border-l-[#2E7D32]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge badge-success">{tournament.status}</span>
                    <span className="text-sm text-gray-500">
                      {tournament.participant_count || 0} players
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tournament.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tournament.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {new Date(tournament.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {tournament.prize_money > 0 && (
                      <span className="text-lg font-bold text-[#2E7D32]">
                        {tournament.prize_money} KES
                      </span>
                    )}
                  </div>
                  <Link
                    to="/tournaments"
                    className="mt-4 btn btn-primary w-full"
                  >
                    Join Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="py-24 bg-tennis-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">500+</div>
              <div className="text-green-200">Active Players</div>
            </div>
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">50+</div>
              <div className="text-green-200">Tennis Courts</div>
            </div>
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">100+</div>
              <div className="text-green-200">Monthly Tournaments</div>
            </div>
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-green-200">Matches Played</div>
            </div>
          </div>
        </div>
      </div>

      {/* Coaching Info Section */}
      <div className="py-16 bg-gradient-to-r from-[#2E7D32] to-[#1B5E20]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              {/* Left Side - Training Info */}
              <div className="p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-[#CCFF00] text-[#1B5E20] px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <span>🎯</span>
                  <span>Professional Training</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Professional Tennis Training
                </h2>
                <p className="text-black mb-6">
                  For beginners and advanced players. Learn from professionals and improve your game.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-3xl font-bold text-[#2E7D32]">1500 KES</span>
                  <span className="text-gray-500">/hour</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📍</span>
                  <span>Nairobi, Kenya</span>
                </div>
              </div>
              
              {/* Right Side - Contact Info */}
              <div className="bg-[#f9fafb] p-8 md:p-10 flex flex-col justify-center">
                <div className="space-y-4">
                  <a 
                    href="https://wa.me/254724565388?text=Hi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="text-2xl">💬</span>
                    <div>
                      <div className="font-bold">WhatsApp</div>
                      <div className="text-sm opacity-90">0724565388</div>
                    </div>
                  </a>
                  <a 
                    href="mailto:johnmakumi106@gmail.com"
                    className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl hover:border-[#2E7D32] hover:text-[#2E7D32] transition-all"
                  >
                    <span className="text-2xl">📧</span>
                    <div>
                      <div className="font-bold">Email</div>
                      <div className="text-sm text-gray-500">johnmakumi106@gmail.com</div>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 p-4 bg-[#2E7D32] text-white rounded-xl">
                    <span className="text-2xl">👤</span>
                    <div>
                      <div className="font-bold">Instructor</div>
                      <div className="text-sm opacity-90">John Makumi</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Start Your Tennis Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Join our community of tennis enthusiasts and take your game to the next level
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="btn btn-primary text-lg px-10 py-4"
              >
                Create Free Account
                <span className="ml-2">🎾</span>
              </Link>
              <Link
                to="/courts"
                className="btn btn-secondary text-lg px-10 py-4"
              >
                Explore Courts
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white text-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">🎾</span>
                <span className="text-xl font-bold">{clubs.length > 0 ? clubs[0].name : 'Tennis Court'}</span>
              </div>
              <p className="text-black">
                {clubs.length > 0 ? clubs[0].description : 'Your complete tennis court booking and tournament management platform.'}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-black">
                <li><Link to="/courts" className="hover:text-blue-600">Courts</Link></li>
                <li><Link to="/tournaments" className="hover:text-blue-600">Tournaments</Link></li>
                <li><Link to="/leaderboard" className="hover:text-blue-600">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Account</h4>
              <ul className="space-y-2 text-black">
                <li><Link to="/login" className="hover:text-blue-600">Login</Link></li>
                <li><Link to="/register" className="hover:text-white">Register</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-black">
                <li>📧 {clubs.length > 0 ? clubs[0].email : 'support@tenniscourt.com'}</li>
                <li>
                  <a 
                    href="https://wa.me/254738839851?text=Hi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-green-600 flex items-center gap-2 transition-colors"
                  >
                    <span>💬</span>
                    <span>0738839851</span>
                  </a>
                </li>
                <li>📍 {clubs.length > 0 ? clubs[0].location : '123 Tennis Street'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-black">
            <p>© {new Date().getFullYear()} {clubs.length > 0 ? clubs[0].name : 'Tennis Court'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

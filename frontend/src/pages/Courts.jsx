import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Courts() {
  const [courts, setCourts] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ court_type: '', is_indoor: '' });
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    booking_date: '',
    start_time: '',
    end_time: '',
    notes: '',
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchCourts();
    fetchClubs();
  }, [filter]);

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.court_type) params.court_type = filter.court_type;
      if (filter.is_indoor) params.is_indoor = filter.is_indoor === 'true';
      
      const data = await api.getCourts(params);
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
    setLoading(false);
  };

  const fetchClubs = async () => {
    try {
      const data = await api.getClubs();
      setClubs(data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleCourtSelect = async (court) => {
    setSelectedCourt(court);
    try {
      const data = await api.getCourtAvailability(court.id);
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to book a court');
      return;
    }

    try {
      const bookingData = {
        court_id: selectedCourt.id,
        booking_date: bookingForm.booking_date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        notes: bookingForm.notes,
      };

      await api.createBooking(bookingData);
      alert('Booking created successfully!');
      setSelectedCourt(null);
      setBookingForm({ booking_date: '', start_time: '', end_time: '', notes: '' });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Academy Info */}
        {clubs.length > 0 && (
          <div className="bg-gradient-to-r from-tennis-green via-tennis-green-light to-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{clubs[0].name}</h1>
                <p className="text-green-100 text-lg">{clubs[0].description}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-white font-bold text-xl">{clubs[0].price_range}</p>
                <p className="text-green-100 text-sm mt-1">{clubs[0].location}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span className="text-lg"></span>
                <span className="font-medium">{clubs[0].email}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span className="text-lg"></span>
                <span className="font-medium">{clubs[0].phone}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <span className="text-lg"></span>
                <span className="font-medium capitalize">For {clubs[0].skill_level}</span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        {clubs.length === 0 && (
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gradient mb-4">Find a Court</h1>
            <p className="text-xl text-gray-600">Book your perfect tennis court</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Courts</h3>
          <div className="flex flex-wrap gap-4">
            <select
              value={filter.court_type}
              onChange={(e) => setFilter({ ...filter, court_type: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all bg-white"
            >
              <option value="">All Court Types</option>
              <option value="hard">Hard Court</option>
              <option value="clay">Clay Court</option>
              <option value="grass">Grass Court</option>
              <option value="synthetic">Synthetic Court</option>
            </select>

            <select
              value={filter.is_indoor}
              onChange={(e) => setFilter({ ...filter, is_indoor: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all bg-white"
            >
              <option value="">All Locations</option>
              <option value="false">Outdoor</option>
              <option value="true">Indoor</option>
            </select>
          </div>
        </div>

        {/* Courts Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tennis-green border-t-transparent mb-6"></div>
            <p className="text-lg text-gray-600 font-medium">Loading amazing courts...</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl"></span>
            </div>
            <p className="text-xl text-gray-600 font-medium">No courts found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courts.map((court) => (
              <div key={court.id} className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100">
                <div className="h-56 bg-gradient-to-br from-tennis-green via-tennis-green-light to-emerald-500 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 court-pattern opacity-20"></div>
                  <span className="text-7xl relative">🎾</span>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                      court.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {court.is_available ? '✓ Available' : '✗ Unavailable'}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{court.name}</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-tennis-green/10 text-tennis-green text-sm font-medium rounded-lg capitalize">
                      {court.court_type}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                      {court.is_indoor ? 'Indoor' : 'Outdoor'}
                    </span>
                  </div>
                  
                  {court.location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <span className="mr-2"></span>
                      <span className="text-sm">{court.location}</span>
                    </div>
                  )}
                  
                  {court.description && (
                    <p className="text-gray-600 mb-6 line-clamp-2">{court.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-3xl font-bold text-tennis-green">
                        {court.price_per_hour} KES
                      </span>
                      <p className="text-sm text-gray-500">per hour</p>
                    </div>
                    <button
                      onClick={() => handleCourtSelect(court)}
                      disabled={!court.is_available}
                      className="px-6 py-3 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                      {court.is_available ? 'Book Now' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedCourt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideIn">
              <div className="bg-gradient-to-r from-tennis-green to-tennis-green-light p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Book {selectedCourt.name}</h2>
                    <p className="text-green-100 mt-1">{selectedCourt.court_type} • {selectedCourt.is_indoor ? 'Indoor' : 'Outdoor'}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCourt(null)}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">

                {/* Availability */}
                {availability && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⏰</span> Available Time Slots
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {availability.available_slots.length > 0 ? (
                        availability.available_slots.map((slot) => (
                          <span
                            key={slot}
                            className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full shadow-md"
                          >
                            {slot}
                          </span>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <span className="text-4xl mb-2 block"></span>
                          <span className="text-gray-500 font-medium">No available slots</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📅 Booking Date
                    </label>
                    <input
                      type="date"
                      value={bookingForm.booking_date}
                      onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        🕐 Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.start_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        🕑 End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.end_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📝 Notes (optional)
                    </label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all resize-none"
                      rows="4"
                      placeholder="Any special requests or preferences..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCourt(null)}
                      className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]"
                    >
                      🎾 Confirm Booking
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courts;

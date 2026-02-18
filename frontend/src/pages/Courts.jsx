import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Courts() {
  const [courts, setCourts] = useState([]);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Find a Court</h1>
          <p className="mt-2 text-gray-600">Book your perfect tennis court</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              value={filter.court_type}
              onChange={(e) => setFilter({ ...filter, court_type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
            >
              <option value="">All Locations</option>
              <option value="false">Outdoor</option>
              <option value="true">Indoor</option>
            </select>
          </div>
        </div>

        {/* Courts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading courts...</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No courts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
                <div className="h-48 bg-gradient-to-br from-tennis-green to-tennis-green-dark flex items-center justify-center">
                  <span className="text-6xl">🎾</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{court.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      court.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {court.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span className="capitalize">{court.court_type}</span>
                    <span>•</span>
                    <span>{court.is_indoor ? 'Indoor' : 'Outdoor'}</span>
                  </div>
                  {court.location && (
                    <p className="text-sm text-gray-500 mb-4">{court.location}</p>
                  )}
                  {court.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{court.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-tennis-green">
                      ${court.price_per_hour}
                      <span className="text-sm font-normal text-gray-500">/hr</span>
                    </span>
                    <button
                      onClick={() => handleCourtSelect(court)}
                      disabled={!court.is_available}
                      className="px-4 py-2 bg-tennis-green text-white rounded-lg hover:bg-tennis-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {selectedCourt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Book {selectedCourt.name}</h2>
                  <button
                    onClick={() => setSelectedCourt(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Availability */}
                {availability && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Available Time Slots</h3>
                    <div className="flex flex-wrap gap-2">
                      {availability.available_slots.length > 0 ? (
                        availability.available_slots.map((slot) => (
                          <span
                            key={slot}
                            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                          >
                            {slot}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No available slots</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookingForm.booking_date}
                      onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.start_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={bookingForm.end_time}
                        onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
                      rows="3"
                      placeholder="Any special requests..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-tennis-green text-white rounded-lg hover:bg-tennis-green-dark"
                  >
                    Confirm Booking
                  </button>
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

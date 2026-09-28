import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatDateTime, statusColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings/client/${user?.id}`);
      setBookings(res.data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const upcoming = bookings.filter(b =>
    new Date(b.startTime) > new Date() && ['confirmed', 'pending'].includes(b.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/client/book" className="card hover:shadow-lg transition cursor-pointer">
            <p className="text-4xl mb-2">ðŸ“…</p>
            <p className="font-semibold text-gray-900">Book Session</p>
            <p className="text-sm text-gray-500">Schedule a new appointment</p>
          </Link>
          <Link to="/client/chat" className="card hover:shadow-lg transition cursor-pointer">
            <p className="text-4xl mb-2">ðŸ’¬</p>
            <p className="font-semibold text-gray-900">Chat</p>
            <p className="text-sm text-gray-500">Message your therapist</p>
          </Link>
          <Link to="/client/notes" className="card hover:shadow-lg transition cursor-pointer">
            <p className="text-4xl mb-2">ðŸ“</p>
            <p className="font-semibold text-gray-900">Shared Notes</p>
            <p className="text-sm text-gray-500">View session notes</p>
          </Link>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-900">Upcoming Sessions</h2>
          {loading ? <p className="text-gray-500">Loading...</p> :
            upcoming.length === 0 ? <p className="text-gray-500">No upcoming sessions</p> : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <div key={b._id} className="flex justify-between border-b border-gray-100 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{formatDateTime(b.startTime)}</p>
                    <p className="text-sm text-gray-500">{b.duration} minutes</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs h-fit ${statusColor(b.status)}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

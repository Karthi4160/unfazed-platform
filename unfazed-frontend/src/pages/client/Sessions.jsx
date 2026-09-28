import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatDateTime, statusColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ClientSessions = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sessions</h1>
        {loading ? <p>Loading...</p> :
          bookings.length === 0 ? <div className="card text-center py-10 text-gray-500">No sessions yet</div> : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b._id} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{formatDateTime(b.startTime)}</p>
                  <p className="text-sm text-gray-500">{b.duration} min â€¢ {b.therapistId?.name || 'Therapist'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusColor(b.status)}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSessions;

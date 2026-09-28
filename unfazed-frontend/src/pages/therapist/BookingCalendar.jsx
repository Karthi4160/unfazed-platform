import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, statusColor } from '../../utils/formatters';
import Modal from '../../components/common/Modal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BookingCalendar = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAvailModal, setShowAvailModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchAvailability();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get(`/bookings/therapist/${user?.id}`);
      setBookings(res.data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/availability');
      setAvailability(res.data.availability);
    } catch (err) { console.error(err); }
  };

const updateWeeklyTemplate = async (dayOfWeek, startTime, endTime, isActive) => {
  // Convert 12-hour "05:00" to 24-hour "17:00" if needed
  // Rule: if hour is 01-07 and represents PM, add 12
  const normalizeTime = (t) => {
    if (!t) return t;
    const match = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return t;
    let [_, h, m] = match;
    h = parseInt(h, 10);

    // If the value came from a 12-hour input as 5:00 PM, it might be "05:00"
    // But we can't tell 5 AM from 5 PM without context.
    // Safest: use 24-hour format explicitly in the UI or default end time to 17:00 if it's < 9
    if (h < 9 && m === '00') {
      // Assume it's PM (end of workday)
      h += 12;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const updated = availability.weeklyTemplate.map(t =>
    t.dayOfWeek === dayOfWeek
      ? {
          ...t,
          startTime: normalizeTime(startTime),
          endTime: normalizeTime(endTime),
          isActive
        }
      : t
  );

  try {
    const res = await api.put('/availability/weekly-template', { weeklyTemplate: updated });
    setAvailability(res.data.availability);
  } catch (err) {
    console.error('Failed to update:', err);
    alert('Failed to update availability');
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Calendar & Availability</h1>
          <button onClick={() => setShowAvailModal(true)} className="btn-primary">Edit Availability</button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold mb-4 text-gray-900">Upcoming Bookings</h2>
            {loading ? <p className="text-gray-500">Loading...</p> :
              bookings.length === 0 ? <p className="text-gray-500">No bookings yet</p> : (
              <div className="space-y-3">
                {bookings.slice(0, 10).map(b => (
                  <div key={b._id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-900">{b.clientId?.name || 'Client'}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(b.startTime)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4 text-gray-900">Weekly Availability</h2>
            <div className="space-y-2">
              {availability?.weeklyTemplate?.map(t => (
                <div key={t.dayOfWeek} className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <span className="w-24 text-gray-700">{DAYS[t.dayOfWeek]}</span>
                  <span className="text-sm text-gray-500">{t.startTime} - {t.endTime}</span>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Modal isOpen={showAvailModal} onClose={() => setShowAvailModal(false)} title="Edit Availability" size="lg">
          <div className="space-y-3">
            {availability?.weeklyTemplate?.map(t => (
              <div key={t.dayOfWeek} className="grid grid-cols-5 gap-2 items-center">
                <span className="text-gray-700">{DAYS[t.dayOfWeek]}</span>
                <input type="time" value={t.startTime} lang="en-GB"
                  onChange={(e) => updateWeeklyTemplate(t.dayOfWeek, e.target.value, t.endTime, t.isActive)}
                  className="input-field" />
                <input type="time" value={t.endTime} lang="en-GB"
                  onChange={(e) => updateWeeklyTemplate(t.dayOfWeek, t.startTime, e.target.value, t.isActive)}
                  className="input-field" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.isActive}
                    onChange={(e) => updateWeeklyTemplate(t.dayOfWeek, t.startTime, t.endTime, e.target.checked)} />
                  Active
                </label>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BookingCalendar;

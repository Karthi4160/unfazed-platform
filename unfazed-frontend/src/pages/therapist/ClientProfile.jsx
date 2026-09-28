import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatDate, formatCurrency, statusColor } from '../../utils/formatters';

const ClientProfile = () => {
  const { clientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sessions');

  useEffect(() => { fetchProfile(); }, [clientId]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/clients/${clientId}/profile`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-20">Loading...</div></div>;
  if (!data) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-20">Client not found</div></div>;

  const { client, bookings, payments, notes } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/therapist/clients" className="text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Back to Clients
        </Link>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {client.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">{client.email} {client.phone && ' â€¢ ' + client.phone}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${statusColor(client.status)}`}>
                {client.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 border-b border-gray-200">
          {['sessions', 'payments', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium capitalize ${
                tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'
              }`}>{t}</button>
          ))}
        </div>

        {tab === 'sessions' && (
          <div className="card">
            <h2 className="font-semibold mb-4 text-gray-900">Session History</h2>
            {bookings?.length ? bookings.map(b => (
              <div key={b._id} className="border-b border-gray-100 py-3 flex justify-between">
                <div>
                  <p className="text-gray-900">{formatDate(b.startTime)}</p>
                  <p className="text-sm text-gray-500">{b.duration} min â€¢ {b.type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs h-fit ${statusColor(b.status)}`}>{b.status}</span>
              </div>
            )) : <p className="text-gray-500">No sessions yet</p>}
          </div>
        )}

        {tab === 'payments' && (
          <div className="card">
            <h2 className="font-semibold mb-4 text-gray-900">Payment History</h2>
            {payments?.length ? payments.map(p => (
              <div key={p._id} className="border-b border-gray-100 py-3 flex justify-between">
                <div>
                  <p className="text-gray-900">{formatCurrency(p.amount)}</p>
                  <p className="text-sm text-gray-500">{formatDate(p.createdAt)} â€¢ {p.invoiceNumber || 'No invoice'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs h-fit ${statusColor(p.status)}`}>{p.status}</span>
              </div>
            )) : <p className="text-gray-500">No payments yet</p>}
          </div>
        )}

        {tab === 'notes' && (
          <div className="card">
            <h2 className="font-semibold mb-4 text-gray-900">Session Notes</h2>
            {notes?.length ? notes.map(n => (
              <div key={n._id} className="border-b border-gray-100 py-3">
                <div className="flex justify-between">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    n.type === 'shared' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>{n.type}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{formatDate(n.sessionDate)}</p>
              </div>
            )) : <p className="text-gray-500">No notes yet</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;

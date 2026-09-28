import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ClientNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/client/${user?.id}`);
      setNotes(res.data.notes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shared Session Notes</h1>
        {loading ? <p>Loading...</p> :
          notes.length === 0 ? <div className="card text-center py-10 text-gray-500">No shared notes yet</div> : (
          <div className="space-y-4">
            {notes.map(n => (
              <div key={n._id} className="card">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <span className="text-sm text-gray-500">{formatDate(n.sessionDate)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotes;

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';

const SessionNotes = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    clientId: '', type: 'private', title: '', content: '',
    sessionDate: new Date().toISOString().split('T')[0]
  });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.clients || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notes', form);
      setShowModal(false);
      setForm({ clientId: '', type: 'private', title: '', content: '', sessionDate: new Date().toISOString().split('T')[0] });
      setMsg('Note created successfully');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create note');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Session Notes</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ New Note</button>
        </div>

        {msg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{msg}</div>}

        <div className="card text-center py-12 text-gray-500">
          <p>Navigate to a client profile to view their session notes.</p>
          <p className="text-sm mt-2">Or create a new note using the button above.</p>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Session Note" size="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Client</label>
              <select required value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input-field">
                <option value="">Select client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option value="private">Private (therapist only)</option>
                <option value="shared">Shared with client</option>
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Session Date</label>
              <input type="date" value={form.sessionDate}
                onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Content</label>
              <textarea rows={6} required value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full">Save Note</button>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default SessionNotes;

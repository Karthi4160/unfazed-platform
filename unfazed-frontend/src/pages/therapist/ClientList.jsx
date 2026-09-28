import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import Modal from '../../components/common/Modal';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchClients(); }, [statusFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients', { params: { status: statusFilter || undefined } });
      setClients(res.data.clients || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setShowAddModal(false);
      setNewClient({ name: '', email: '', phone: '' });
      setMsg('Client added successfully');
      fetchClients();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add client');
    }
  };

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">+ Add Client</button>
        </div>

        {msg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{msg}</div>}

        <div className="card mb-4 flex gap-3 flex-wrap">
          <input placeholder="Search by name or email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1 min-w-[200px]" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="waiting">Waiting</option>
          </select>
        </div>

        {loading ? <div className="text-center py-10 text-gray-500">Loading...</div> :
          filtered.length === 0 ? <div className="card text-center py-10 text-gray-500">No clients found</div> : (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Sessions</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        c.status === 'active' ? 'bg-green-100 text-green-800' :
                        c.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.totalSessions || 0}</td>
                    <td className="px-4 py-3">
                      <Link to={`/therapist/clients/${c._id}`} className="text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Client">
          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input required value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Email</label>
              <input required type="email" value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full">Add Client</button>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ClientList;

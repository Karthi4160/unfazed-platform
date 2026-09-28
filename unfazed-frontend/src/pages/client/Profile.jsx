import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ClientProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    presentingConcern: '',
    history: '',
    medications: '',
    allergies: ''
  });
  const [msg, setMsg] = useState('');

  // Get ID (handles both _id and id)
  const clientId = user?._id || user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!clientId) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [clientId, authLoading]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clients/${clientId}`);
      setClient(res.data.client);
      setForm({
        presentingConcern: res.data.client?.intake?.presentingConcern || '',
        history: res.data.client?.intake?.history || '',
        medications: res.data.client?.intake?.medications || '',
        allergies: res.data.client?.intake?.allergies || ''
      });
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitIntake = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/clients/${clientId}/intake`, form);
      setMsg('Intake information saved');
      fetchProfile();
    } catch (err) {
      setMsg('Failed to save');
    }
  };

  const captureConsent = async () => {
    try {
      await api.post(`/clients/${clientId}/consent`, { version: '1.0' });
      setMsg('Consent captured');
      fetchProfile();
    } catch (err) {
      setMsg('Failed to capture consent');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        <div className="card mb-6">
          <h2 className="font-semibold mb-4 text-gray-900">Account Information</h2>
          <p className="text-gray-700"><strong>Name:</strong> {user?.name || '—'}</p>
          <p className="text-gray-700"><strong>Email:</strong> {user?.email || '—'}</p>
          {user?.phone && <p className="text-gray-700"><strong>Phone:</strong> {user.phone}</p>}
        </div>

        {msg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{msg}</div>}

        <div className="card mb-6">
          <h2 className="font-semibold mb-4 text-gray-900">Intake Information</h2>
          <form onSubmit={submitIntake} className="space-y-4">
            <div>
              <label className="label">Presenting Concern</label>
              <textarea rows={3} value={form.presentingConcern}
                onChange={(e) => setForm({ ...form, presentingConcern: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">History</label>
              <textarea rows={3} value={form.history}
                onChange={(e) => setForm({ ...form, history: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Current Medications</label>
              <input value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Allergies</label>
              <input value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="input-field" />
            </div>
            <button type="submit" className="btn-primary">Save Intake</button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-900">Consent</h2>
          {client?.intake?.consent?.signed ? (
            <p className="text-green-600">
              ✅ Consent signed on {new Date(client.intake.consent.signedAt).toLocaleString()}
            </p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Please read and accept the terms of service and privacy policy to proceed with therapy sessions.
              </p>
              <button onClick={captureConsent} className="btn-primary">
                I Agree & Sign Consent
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
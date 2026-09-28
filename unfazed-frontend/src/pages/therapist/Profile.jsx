import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';

const TherapistProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    credentials: user?.credentials || '',
    yearsOfExperience: user?.yearsOfExperience || '',
    specializations: (user?.specializations || []).join(', '),
    languages: (user?.languages || []).join(', ')
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await api.put('/auth/profile', payload);
      updateUser(res.data.therapist);
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        <div className="card mb-6">
          <p className="text-sm text-gray-500">Your Public URL</p>
          <a href={`/${user?.slug}`} target="_blank" rel="noreferrer"
            className="text-indigo-600 underline">
            {window.location.origin}/{user?.slug}
          </a>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {msg && (
            <div className={`px-4 py-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg}
            </div>
          )}

          <div>
            <label className="label">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea name="bio" rows={5} value={form.bio} onChange={handleChange}
              className="input-field" placeholder="Tell clients about your practice..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Credentials</label>
              <input name="credentials" value={form.credentials} onChange={handleChange}
                className="input-field" placeholder="M.A. Clinical Psychology" />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input name="yearsOfExperience" type="number" value={form.yearsOfExperience}
                onChange={handleChange} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label">Specializations (comma separated)</label>
            <input name="specializations" value={form.specializations} onChange={handleChange}
              className="input-field" placeholder="Anxiety, Depression, CBT" />
          </div>
          <div>
            <label className="label">Languages (comma separated)</label>
            <input name="languages" value={form.languages} onChange={handleChange}
              className="input-field" placeholder="English, Hindi" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TherapistProfile;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientRegister = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/auth/client/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone
      });
      const { token, client } = res.data;

      // Clear any existing auth
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('clientData');

      // Set client auth
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'client');
      localStorage.setItem('clientData', JSON.stringify(client));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Full reload to reset all context
      window.location.href = '/client/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Client Sign Up</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Create your account to get started</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Full Name</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field" placeholder="9876543210" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" required value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="input-field" placeholder="Repeat password" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary bg-purple-600 hover:bg-purple-700">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/client/login" className="font-medium text-purple-600 hover:text-purple-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ClientRegister;
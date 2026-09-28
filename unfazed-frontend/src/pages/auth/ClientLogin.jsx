import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ClientLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { clientLogin, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await clientLogin(form.email, form.password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Client Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field" placeholder="Your password" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary bg-purple-600 hover:bg-purple-700">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-600">
            New here?{' '}
            <Link to="/client/register" className="font-medium text-purple-600 hover:text-purple-500">
              Sign up
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500">
            Are you a therapist?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Therapist login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ClientLogin;
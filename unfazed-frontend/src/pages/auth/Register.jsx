import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register, error } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      return setLocalError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setLocalError('Password must be at least 6 characters');
    }

    setLoading(true);
    await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Create Account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Start managing your practice today</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {(localError || error) && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {localError || error}
            </div>
          )}

          <div>
            <label className="label">Full Name</label>
            <input name="name" type="text" required value={formData.name}
              onChange={handleChange} className="input-field" placeholder="Dr. Jane Doe" />
          </div>

          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required value={formData.email}
              onChange={handleChange} className="input-field" placeholder="you@example.com" />
          </div>

          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required value={formData.password}
              onChange={handleChange} className="input-field" placeholder="Min 6 characters" />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input name="confirmPassword" type="password" required value={formData.confirmPassword}
              onChange={handleChange} className="input-field" placeholder="Repeat password" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

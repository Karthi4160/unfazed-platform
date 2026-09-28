import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const PublicProfile = () => {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [slug]);

  const fetchProfile = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await axios.get(`${API_URL}/auth/profile/${slug}`);
      setTherapist(res.data.therapist);
      document.title = `${res.data.therapist.name} | Unfazed`;
    } catch (err) {
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl text-gray-500">{error}</p>
        <Link to="/login" className="text-indigo-600 mt-4 inline-block">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          {therapist.profileImage ? (
            <img src={therapist.profileImage} alt={therapist.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white shadow-xl object-cover" />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white shadow-xl bg-white/20 flex items-center justify-center text-5xl font-bold">
              {therapist.name[0]}
            </div>
          )}
          <h1 className="text-4xl font-bold mb-2">{therapist.name}</h1>
          <p className="text-xl opacity-90">{therapist.credentials || 'Licensed Therapist'}</p>
          {therapist.yearsOfExperience > 0 && (
            <p className="mt-2 opacity-80">{therapist.yearsOfExperience} years experience</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {therapist.bio && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{therapist.bio}</p>
          </div>
        )}

        {therapist.specializations?.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {therapist.specializations.map((s, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {therapist.languages?.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {therapist.languages.map((l, i) => (
                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Book a Session</h2>
          <p className="text-gray-600 mb-2">
            Session Duration: {therapist.sessionDuration || 60} minutes
          </p>
          <p className="text-gray-600 mb-6">
            Rate: â‚¹{therapist.settings?.paymentSettings?.sessionRate || 'Contact for pricing'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              to="/client/login"
              className="btn-primary inline-block"
            >
              Login as Client to Book
            </Link>
            <Link
              to="/client/register"
              className="btn-secondary inline-block"
            >
              New? Sign Up to Book
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatCurrency, formatDateTime, statusColor } from '../../utils/formatters';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalClients: 0, upcomingSessions: 0, revenue: 0, noShowRate: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, revenueRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get(`/bookings/therapist/${user?.id}?limit=5`),
        api.get('/analytics/revenue')
      ]);

      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data.bookings || []);
      setRevenueData(revenueRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome back, {user?.name}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Upcoming Sessions</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.upcomingSessions}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Revenue (Month)</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenue)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">No-Show Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.noShowRate}%</p>
          </div>
        </div>

        {revenueData.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{booking.clientId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(booking.startTime)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(booking.amount)}</td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">No bookings yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

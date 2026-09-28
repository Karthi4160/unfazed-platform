import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ sessionRate: 1000, currency: 'INR' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchSubscription();
    fetchTiers();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/current');
      setSubscription(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTiers = async () => {
    try {
      const res = await api.get('/subscriptions/tiers');
      setTiers(res.data.tiers || []);
    } catch (err) { console.error(err); }
  };

  const changeTier = async (tier) => {
    try {
      await api.post('/subscriptions/change-tier', { tier });
      setMsg(`Switched to ${tier} plan`);
      updateUser({ subscriptionTier: tier });
      fetchSubscription();
    } catch (err) { setMsg('Failed to change tier'); }
  };

  const updatePaymentSettings = async () => {
    try {
      await api.put('/therapists/payment-settings', paymentForm);
      setMsg('Payment settings updated');
    } catch (err) { setMsg('Update failed'); }
  };

  const changePassword = async () => {
    try {
      await api.put('/auth/change-password', passwordForm);
      setMsg('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) { setMsg('Password change failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {msg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{msg}</div>}

        <div className="card mb-6">
          <h2 className="font-semibold mb-4 text-gray-900">Subscription</h2>
          <p className="text-gray-600 mb-4">
            Current plan: <strong>{subscription?.tier || user?.subscriptionTier}</strong>
          </p>

          {subscription?.usage && (
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-500">Active Clients</p>
                <p className="font-semibold text-gray-900">
                  {subscription.usage.activeClients} / {subscription.usage.limits.maxActiveClients}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-500">Sessions This Month</p>
                <p className="font-semibold text-gray-900">
                  {subscription.usage.sessionsThisMonth} / {subscription.usage.limits.sessionsPerMonth}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {tiers.map(t => (
              <div key={t.tier} className={`border rounded-lg p-4 ${subscription?.tier === t.tier ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-lg font-bold text-indigo-600 my-2">
                  {t.price?.monthly ? formatCurrency(t.price.monthly) : 'Free'}
                </p>
                <p className="text-xs text-gray-500 mb-3">Up to {t.features.maxActiveClients} clients</p>
                {subscription?.tier !== t.tier && (
                  <button onClick={() => changeTier(t.tier)} className="btn-primary w-full text-sm">Switch</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="font-semibold mb-4 text-gray-900">Payment Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Session Rate (â‚¹)</label>
              <input type="number" value={paymentForm.sessionRate}
                onChange={(e) => setPaymentForm({ ...paymentForm, sessionRate: Number(e.target.value) })}
                className="input-field" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select value={paymentForm.currency}
                onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                className="input-field">
                <option>INR</option>
                <option>USD</option>
              </select>
            </div>
          </div>
          <button onClick={updatePaymentSettings} className="btn-primary mt-4">Save Payment Settings</button>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4 text-gray-900">Change Password</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field" />
            </div>
            <button onClick={changePassword} className="btn-primary">Update Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatCurrency, formatDate, statusColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get(`/payments/therapist/${user?.id}`),
        api.get(`/payments/revenue/${user?.id}`)
      ]);
      setPayments(pRes.data.payments || []);
      setStats(sRes.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const res = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNumber || paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download failed:', err);
      alert('Could not download invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalNetRevenue)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Platform Fees</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPlatformFees)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
            </div>
          </div>
        )}

        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-4 text-gray-900">Transaction History</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-gray-500">No payments yet</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-900">{p.clientId?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.invoiceNumber || '—'}</td>
                    <td className="px-4 py-3">
                      {p.status === 'paid' && p.invoiceNumber ? (
                        <button
                          onClick={() => downloadInvoice(p._id, p.invoiceNumber)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm font-medium"
                        >
                          📄 Download
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
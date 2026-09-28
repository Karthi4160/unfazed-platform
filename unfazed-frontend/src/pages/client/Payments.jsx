import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { formatCurrency, formatDate, statusColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const ClientPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/payments/client/${user?.id}`);
      setPayments(res.data.payments || []);
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
      alert('Could not download invoice');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment History</h1>
        {loading ? (
          <p>Loading...</p>
        ) : payments.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">No payments yet</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 text-gray-700">{formatDate(p.createdAt)}</td>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPayments;
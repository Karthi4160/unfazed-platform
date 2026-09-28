import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ClientBooking = () => {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchTherapists(); }, []);
  useEffect(() => { if (selectedTherapist) fetchSlots(); }, [selectedTherapist, date]);

  const fetchTherapists = async () => {
    try {
      const res = await api.get('/therapists');
      setTherapists(res.data.therapists || []);
    } catch (err) { console.error(err); }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/available-slots', {
        params: { therapistId: selectedTherapist._id, date }
      });
      setSlots(res.data.slots || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const bookSlot = async (slot) => {
  try {
    const res = await api.post('/bookings/book', {
      therapistId: selectedTherapist._id,
      clientId: user?._id || user?.id,
      startTime: slot.start,
      endTime: slot.end,
      duration: selectedTherapist.sessionDuration || 60
    });

    console.log('[Booking] Response:', res.data);

    if (!res.data.payment) {
      alert('✅ Booking confirmed!');
      window.location.href = '/client/sessions';
      return;
    }

    const payment = res.data.payment;
    const razorpayKey = payment.key || import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKey || razorpayKey.includes('xxxx')) {
      alert('Razorpay not configured.');
      window.location.href = '/client/sessions';
      return;
    }

    // Helper to poll the backend for payment status
    const pollPaymentStatus = async (maxAttempts = 10) => {
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const statusRes = await api.get(`/payments/status/${payment.id}`);
          console.log(`[Poll ${i + 1}] Status:`, statusRes.data.payment?.status);

          if (statusRes.data.payment?.status === 'paid') {
            return true;
          }
        } catch (err) {
          console.warn('[Poll] Error:', err.message);
        }
        // Wait 1.5s between attempts
        await new Promise(r => setTimeout(r, 1500));
      }
      return false;
    };

    // Mark payment as paid (called after Razorpay completes)
    const markPaymentPaid = async (response) => {
      try {
        console.log('[Razorpay] Marking payment as paid:', response);
        await api.post('/payments/verify', {
          orderId: response?.razorpay_order_id || payment.orderId,
          paymentId: response?.razorpay_payment_id || 'test_' + Date.now(),
          signature: response?.razorpay_signature || 'test_signature',
          paymentRecordId: payment.id
        });
        console.log('[Razorpay] ✅ Marked as paid');
        alert('✅ Payment successful! Booking confirmed.');
        window.location.href = '/client/sessions';
      } catch (err) {
        console.error('[Razorpay] Mark error:', err.response?.data || err.message);
        // Try polling anyway
        const ok = await pollPaymentStatus();
        if (ok) {
          window.location.href = '/client/sessions';
        } else {
          alert('Payment might have succeeded. Check /client/payments.');
          window.location.href = '/client/payments';
        }
      }
    };

    const options = {
      key: razorpayKey,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency || 'INR',
      name: 'Unfazed',
      description: 'Therapy Session',
      order_id: payment.orderId,
      handler: (response) => {
        // This fires when Razorpay completes successfully
        console.log('[Razorpay] ✅ Handler fired:', response);
        markPaymentPaid(response);
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: async () => {
          // Popup was closed — check if payment went through despite the callback not firing
          console.log('[Razorpay] Modal dismissed — polling for payment status');
          const ok = await pollPaymentStatus(5);
          if (ok) {
            alert('✅ Payment successful!');
            window.location.href = '/client/sessions';
          } else {
            console.log('[Razorpay] Payment not completed');
          }
        }
      }
    };

    console.log('[Razorpay] Opening with order_id:', payment.orderId);
    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      console.error('[Razorpay] Payment failed:', response.error);
      alert('Payment failed: ' + (response.error?.description || 'Unknown'));
    });

    rzp.open();
  } catch (err) {
    console.error('Booking error:', err);
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Booking failed';
    alert(`Booking failed: ${msg}`);
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h1>

        <div className="card mb-6">
          <label className="label">Select Therapist</label>
          <select value={selectedTherapist?._id || ''}
            onChange={(e) => setSelectedTherapist(therapists.find(t => t._id === e.target.value))}
            className="input-field">
            <option value="">Choose a therapist</option>
            {therapists.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>

        {selectedTherapist && (
          <div className="card">
            <label className="label">Select Date</label>
            <input type="date" value={date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)} className="input-field mb-4" />

            <h3 className="font-semibold mb-3 text-gray-900">Available Slots</h3>
            {loading ? <p className="text-gray-500">Loading...</p> :
              slots.length === 0 ? <p className="text-gray-500">No available slots</p> : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {slots.map((slot, i) => (
                  <button key={i} onClick={() => bookSlot(slot)}
                    className="p-3 border border-indigo-300 rounded-lg hover:bg-indigo-50 text-sm font-medium">
                    {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBooking;

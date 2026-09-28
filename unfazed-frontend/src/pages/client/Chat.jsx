import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const ClientChat = () => {
  const { user } = useAuth();
  const { socket, sendMessage: sendViaSocket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [therapistId, setTherapistId] = useState(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef();

  const userId = user?._id || user?.id;

  // Load therapist + initial conversation
  useEffect(() => {
    if (!userId) return;
    fetchTherapistAndMessages();
  }, [userId]);

  // Attach socket listeners — one set per socket instance
  useEffect(() => {
    if (!socket) return;

    console.log('[Chat] Attaching listeners for socket:', socket.id);
    setConnected(socket.connected);

    const handleReceive = (msg) => {
      console.log('[Chat] ✅ Received:', msg);
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleSent = (msg) => {
      console.log('[Chat] ✅ Sent confirmation:', msg);
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleConnect = () => {
      console.log('[Chat] Socket connected');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[Chat] Socket disconnected');
      setConnected(false);
    };

    const handleError = (err) => {
      console.error('[Chat] Socket error:', err);
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    return () => {
      console.log('[Chat] Detaching listeners');
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTherapistAndMessages = async () => {
    try {
      const bookings = await api.get(`/bookings/client/${userId}`);
      const therapist = bookings.data.bookings?.[0]?.therapistId;
      if (therapist) {
        const tId = therapist._id || therapist.id;
        setTherapistId(tId);
        const msgs = await api.get('/chat/client/conversation', {
          params: { otherUserId: tId, otherUserType: 'Therapist' }
        });
        setMessages(msgs.data.messages || []);
      }
    } catch (err) {
      console.error('Chat load error:', err.response?.data || err.message);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !therapistId) return;
    const ok = sendViaSocket(therapistId, 'Therapist', input, 'text');
    if (ok) setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="card flex flex-col" style={{ height: '600px' }}>
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 py-10">No messages yet</p>
            )}
            {messages.map((m, i) => {
              const senderId = m.fromUserId?._id || m.fromUserId?.id || m.fromUserId;
              const isMe = senderId === userId;
              return (
                <div key={m._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              className="input-field flex-1"
              disabled={!connected}
            />
            <button type="submit" disabled={!connected || !input.trim()} className="btn-primary">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientChat;
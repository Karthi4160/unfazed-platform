import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/common/Navbar';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const TherapistChat = () => {
  const { user } = useAuth();
  const { socket, sendMessage: sendViaSocket } = useSocket();
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef();

  // Keep a ref of the selected client so socket handlers always see the latest
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const userId = user?._id || user?.id;

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Attach socket listeners — once per socket
  useEffect(() => {
    if (!socket) return;

    console.log('[TherapistChat] Attaching listeners for socket:', socket.id);
    setConnected(socket.connected);

    const handleConnect = () => {
      console.log('[TherapistChat] Socket connected');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[TherapistChat] Socket disconnected');
      setConnected(false);
    };

    const handleReceive = (msg) => {
      console.log('[TherapistChat] ✅ Received:', msg);
      const currentSelectedId = selectedRef.current?._id || selectedRef.current?.id;
      const senderId = msg.fromUserId?._id || msg.fromUserId?.id || msg.fromUserId;

      // Only add if the message belongs to the currently selected conversation
      if (currentSelectedId && senderId !== currentSelectedId) {
        console.log('[TherapistChat] Ignoring message from non-selected client');
        return;
      }

      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleSent = (msg) => {
      console.log('[TherapistChat] ✅ Sent confirmation:', msg);
      const currentSelectedId = selectedRef.current?._id || selectedRef.current?.id;
      const recipientId = msg.toUserId?._id || msg.toUserId?.id || msg.toUserId;

      // Only add if the message was sent to the currently selected conversation
      if (currentSelectedId && recipientId !== currentSelectedId) {
        console.log('[TherapistChat] Ignoring sent message for non-selected client');
        return;
      }

      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const handleError = (err) => {
      console.error('[TherapistChat] Socket error:', err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('error', handleError);

    return () => {
      console.log('[TherapistChat] Detaching listeners');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Load conversation when client selection changes
  useEffect(() => {
    if (selected) loadConversation(selected);
  }, [selected]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.clients || []);
      // Do not auto-select — therapist chooses explicitly
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (client) => {
    try {
      const cId = client._id || client.id;
      const res = await api.get('/chat/conversation', {
        params: { otherUserId: cId, otherUserType: 'Client' }
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    const cId = selected._id || selected.id;
    const ok = sendViaSocket(cId, 'Client', input, 'text');
    if (ok) {
      setInput('');
    } else {
      alert('Not connected. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4" style={{ height: '600px' }}>
          {/* Clients sidebar */}
          <div className="card col-span-1 overflow-y-auto">
            <h3 className="font-semibold mb-3 text-gray-900">Clients</h3>
            {clients.length === 0 && (
              <p className="text-sm text-gray-500 px-3">No clients yet</p>
            )}
            {clients.map(c => (
              <button
                key={c._id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center justify-between ${
                  selected?._id === c._id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-xs text-gray-400">{c.email}</span>
              </button>
            ))}
          </div>

          {/* Conversation panel */}
          <div className="card col-span-3 flex flex-col">
            {selected ? (
              <>
                <div className="border-b pb-3 mb-3">
                  <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                </div>
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
                    placeholder="Type a message..."
                    className="input-field flex-1"
                    disabled={!connected}
                  />
                  <button type="submit" disabled={!connected} className="btn-primary">Send</button>
                </form>
              </>
            ) : (
              <p className="text-center text-gray-500 py-10">Select a client to start chatting</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistChat;
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token, userType, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  // Only depend on token + isAuthenticated — NOT on user object
  const userId = user?._id || user?.id;
  const normalizedUserType = userType === 'client' ? 'Client' : 'Therapist';

  useEffect(() => {
    // Disconnect if not authenticated
    if (!isAuthenticated || !token || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Already connected as same user → do nothing
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    console.log('[Socket] Creating new connection for', normalizedUserType, userId);
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('[Socket] connected:', newSocket.id);
      newSocket.emit('authenticate', {
        userId,
        userType: normalizedUserType
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] connection error:', err.message);
    });

    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId && u.userType === data.userType);
        return exists ? prev : [...prev, data];
      });
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(
        u => !(u.userId === data.userId && u.userType === data.userType)
      ));
    });

    setSocket(newSocket);

    return () => {
      // Do NOT disconnect on unmount unless logged out — the connection should persist
    };
  }, [isAuthenticated, token, userId, normalizedUserType]);

  // Cleanup only on explicit logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  }, [isAuthenticated]);

  const sendMessage = (toUserId, toUserType, message, type = 'text') => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('[Socket] not connected — cannot send');
      return false;
    }
    socketRef.current.emit('send_message', {
      toUserId,
      toUserType,
      message,
      type
    });
    return true;
  };

  const emitTyping = (toUserId, toUserType, isTyping) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', { toUserId, toUserType, isTyping });
    }
  };

  const value = {
    socket,
    onlineUsers,
    sendMessage,
    emitTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
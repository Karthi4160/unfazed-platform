import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ClientLogin from './pages/auth/ClientLogin';
import ClientRegister from './pages/auth/ClientRegister';

// Public
import PublicProfile from './pages/public/Profile';

// Therapist pages
import TherapistDashboard from './pages/therapist/Dashboard';
import TherapistProfile from './pages/therapist/Profile';
import BookingCalendar from './pages/therapist/BookingCalendar';
import ClientList from './pages/therapist/ClientList';
import ClientProfile from './pages/therapist/ClientProfile';
import SessionNotes from './pages/therapist/SessionNotes';
import Payments from './pages/therapist/Payments';
import Analytics from './pages/therapist/Analytics';
import Settings from './pages/therapist/Settings';
import TherapistChat from './pages/therapist/Chat';

// Client pages
import ClientDashboard from './pages/client/Dashboard';
import ClientBooking from './pages/client/Booking';
import ClientSessions from './pages/client/Sessions';
import ClientNotes from './pages/client/Notes';
import ClientChat from './pages/client/Chat';
import ClientPayments from './pages/client/Payments';
import ClientProfilePage from './pages/client/Profile';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* ---------- AUTH ROUTES (specific first) ---------- */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/register" element={<ClientRegister />} />

                {/* ---------- THERAPIST PROTECTED ---------- */}
                <Route path="/therapist" element={<PrivateRoute />}>
                  <Route path="dashboard" element={<TherapistDashboard />} />
                  <Route path="profile" element={<TherapistProfile />} />
                  <Route path="calendar" element={<BookingCalendar />} />
                  <Route path="clients" element={<ClientList />} />
                  <Route path="clients/:clientId" element={<ClientProfile />} />
                  <Route path="notes" element={<SessionNotes />} />
                  <Route path="chat" element={<TherapistChat />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* ---------- CLIENT PROTECTED ---------- */}
                <Route path="/client" element={<PrivateRoute clientRoute />}>
                  <Route path="dashboard" element={<ClientDashboard />} />
                  <Route path="book" element={<ClientBooking />} />
                  <Route path="sessions" element={<ClientSessions />} />
                  <Route path="notes" element={<ClientNotes />} />
                  <Route path="chat" element={<ClientChat />} />
                  <Route path="payments" element={<ClientPayments />} />
                  <Route path="profile" element={<ClientProfilePage />} />
                </Route>

                {/* ---------- WILDCARD PUBLIC PROFILE (LAST) ---------- */}
                <Route path="/:slug" element={<PublicProfile />} />

                {/* ---------- FALLBACK ---------- */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
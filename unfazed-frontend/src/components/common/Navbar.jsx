import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isTherapist = location.pathname.startsWith('/therapist');
  const isClientPortal = location.pathname.startsWith('/client');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const therapistLinks = [
    { to: '/therapist/dashboard', label: 'Dashboard' },
    { to: '/therapist/calendar', label: 'Calendar' },
    { to: '/therapist/clients', label: 'Clients' },
    { to: '/therapist/notes', label: 'Notes' },
    { to: '/therapist/chat', label: 'Messages' },
    { to: '/therapist/payments', label: 'Payments' },
    { to: '/therapist/analytics', label: 'Analytics' }
  ];

  const clientLinks = [
    { to: '/client/dashboard', label: 'Dashboard' },
    { to: '/client/book', label: 'Book' },
    { to: '/client/sessions', label: 'Sessions' },
    { to: '/client/notes', label: 'Notes' },
    { to: '/client/chat', label: 'Chat' },
    { to: '/client/payments', label: 'Payments' }
  ];

  const links = isTherapist ? therapistLinks : isClientPortal ? clientLinks : [];

  const homeUrl = isTherapist
    ? '/therapist/dashboard'
    : isClientPortal
    ? '/client/dashboard'
    : '/';

  const profileUrl = isTherapist ? '/therapist/profile' : '/client/profile';

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={homeUrl} className="text-2xl font-bold text-indigo-600">
              Unfazed
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === link.to
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm text-gray-700">{user?.name}</span>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                  <Link
                    to={profileUrl}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  {isTherapist && (
                    <Link
                      to="/therapist/settings"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
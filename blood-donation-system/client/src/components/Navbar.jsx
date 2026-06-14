import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BloodDropIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 4 10.5 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 10.5 12 2 12 2Z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const getRoleLinks = (role) => {
  if (role === 'donor')     return [{ to: '/donor',     label: 'Dashboard' }];
  if (role === 'recipient') return [{ to: '/recipient', label: 'Dashboard' }];
  if (role === 'admin')     return [{ to: '/admin',     label: 'Admin Panel' }];
  return [];
};

const getRoleColor = (role) => {
  if (role === 'donor')     return 'bg-emerald-700/60 text-emerald-300';
  if (role === 'recipient') return 'bg-blue-700/60 text-blue-300';
  if (role === 'admin')     return 'bg-purple-700/60 text-purple-300';
  return 'bg-gray-700 text-gray-300';
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAuthenticated ? getRoleLinks(user?.role) : [];

  return (
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 text-blood-400 cursor-default">
              <BloodDropIcon />
              <span className="text-xl font-bold text-white">
                Blood<span className="text-blood-400">Link</span>
              </span>
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-2.5 text-blood-400 hover:text-blood-300 transition-colors">
              <BloodDropIcon />
              <span className="text-xl font-bold text-white">
                Blood<span className="text-blood-400">Link</span>
              </span>
            </Link>
          )}

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-200 ${
                  location.pathname.startsWith(link.to)
                    ? 'text-blood-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2">
                  {user?.role !== 'admin' && (
                    <span className="text-sm text-gray-400 font-medium">{user?.name}</span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2 px-4"
                  id="logout-btn"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="mobile-menu-btn"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block text-sm font-medium text-gray-300 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-3 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-2">
                  {user?.role === 'admin' ? 'Admin' : `${user?.name} (${user?.role})`}
                </p>
                <button onClick={handleLogout} className="btn-secondary w-full text-sm">Logout</button>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-800">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block btn-secondary text-sm text-center">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

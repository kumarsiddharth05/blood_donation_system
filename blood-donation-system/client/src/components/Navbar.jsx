import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BloodDropIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 4 10.5 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 10.5 12 2 12 2Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3h-9m9 0l-3-3m3 3l-3 3" />
  </svg>
);

const getRoleBadge = (role) => {
  const map = {
    donor:     'bg-emerald-700/60 text-emerald-300',
    recipient: 'bg-blue-700/60 text-blue-300',
    admin:     'bg-purple-700/60 text-purple-300',
  };
  return map[role] || 'bg-gray-700 text-gray-300';
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="top-bar" id="top-navbar">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2 text-blood-400">
            <BloodDropIcon />
            <span className="text-lg font-bold text-white">
              Blood<span className="text-blood-400">Link</span>
            </span>
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-blood-400 hover:text-blood-300 transition-colors">
            <BloodDropIcon />
            <span className="text-lg font-bold text-white">
              Blood<span className="text-blood-400">Link</span>
            </span>
          </Link>
        )}

        {/* Right: always visible */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Role badge */}
              <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-semibold capitalize ${getRoleBadge(user?.role)}`}>
                {user?.role}
              </span>
              {/* Logout — always visible, not hidden in a menu */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all active:scale-95"
                id="logout-btn"
              >
                <LogoutIcon />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-95"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

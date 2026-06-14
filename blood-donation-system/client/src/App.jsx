import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomTabBar from './components/BottomTabBar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import AdminDashboard from './pages/AdminDashboard';

// ── Landing / Home page ───────────────────────────────────────────────────────
const Home = () => (
  <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center relative overflow-hidden">
    {/* Background decorations */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-blood-700/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-blood-900/20 rounded-full blur-3xl" />
    </div>

    {/* Blood drop SVG */}
    <div className="text-blood-500 mb-3 animate-pulse-slow">
      <svg className="w-14 h-14 mx-auto" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C12 2 4 10.5 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 10.5 12 2 12 2Z" />
      </svg>
    </div>

    <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 animate-slide-up">
      Blood<span className="text-blood-400">Link</span>
    </h1>
    <p className="text-base sm:text-lg text-gray-400 mb-2 max-w-2xl animate-slide-up">
      A complete Blood Donation Management System
    </p>
    <p className="text-gray-600 mb-6 max-w-xl text-xs sm:text-sm animate-slide-up px-2">
      Connecting donors, recipients, and blood banks — powered by real-time inventory tracking, smart compatibility matching, and role-based dashboards.
    </p>

    <div className="flex flex-col gap-3 animate-fade-in w-full max-w-xs sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
      <Link to="/register?role=donor" id="home-donor-btn" className="btn-primary text-sm sm:text-base px-6 py-2.5 text-center">
        🩸 Become a Donor
      </Link>
      <Link to="/register?role=recipient" id="home-recipient-btn" className="btn-secondary text-sm sm:text-base px-6 py-2.5 border-blue-700 text-blue-300 hover:bg-blue-900/40 text-center">
        💉 Become a Recipient
      </Link>
      <Link to="/register?role=admin" id="home-admin-btn" className="btn-secondary text-sm sm:text-base px-6 py-2.5 border-purple-700 text-purple-300 hover:bg-purple-900/40 text-center">
        🛡️ Become an Admin
      </Link>
    </div>

    <p className="text-gray-600 text-sm mt-3 animate-fade-in">
      Already have an account?{' '}
      <Link to="/login" className="text-blood-400 hover:text-blood-300 transition-colors font-medium">Sign In</Link>
    </p>

    {/* Feature highlights */}
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl w-full text-left animate-fade-in px-1">
      {[
        {
          icon: '💉',
          title: 'Donor Management',
          desc: 'Track eligibility, donation history, and get automatic notifications.',
        },
        {
          icon: '🏥',
          title: 'Smart Matching',
          desc: 'Full ABO + Rh blood compatibility matrix to find compatible banks.',
        },
        {
          icon: '📊',
          title: 'Admin Dashboard',
          desc: 'Real-time inventory monitoring, request approval, and reporting.',
        },
      ].map((f) => (
        <div key={f.title} className="card p-4 hover:border-blood-700/40 transition-all duration-300 group">
          <span className="text-xl mb-1.5 block">{f.icon}</span>
          <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-blood-400 transition-colors">{f.title}</h3>
          <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
);


// ── Route Guards ─────────────────────────────────────────────────────────────
const HomeRoute = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated && user?.role) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return <Home />;
};

// ── App Shell with Bottom Tab Bar ─────────────────────────────────────────────
const AppShell = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (!user?.role) return 'overview';
    if (user.role === 'recipient') return 'requests';
    return 'overview';
  });

  // Determine default tab when role changes
  const getDefaultTab = (role) => {
    if (role === 'recipient') return 'requests';
    return 'overview';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const showBottomBar = isAuthenticated && user?.role;

  return (
    <>
      <Navbar />
      <main className={showBottomBar ? 'app-content' : 'flex-1'}>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<HomeRoute />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected: Donor */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute role="donor">
                <DonorDashboard activeTab={activeTab} onTabChange={handleTabChange} />
              </ProtectedRoute>
            }
          />

          {/* Protected: Recipient */}
          <Route
            path="/recipient"
            element={
              <ProtectedRoute role="recipient">
                <RecipientDashboard activeTab={activeTab} onTabChange={handleTabChange} />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard activeTab={activeTab} onTabChange={handleTabChange} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showBottomBar && (
        <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <div className="min-h-screen min-h-[100dvh] bg-gray-950 flex flex-col overflow-x-hidden">
        <AppShell />
      </div>
    </AuthProvider>
  </BrowserRouter>
);

export default App;

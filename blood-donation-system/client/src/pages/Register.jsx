import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = ['donor', 'recipient', 'admin'];

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    // Donor fields
    blood_group: '',
    dob: '',
    phone: '',
    address: '',
    // Recipient fields
    // (phone and address are shared with donor)
  });

  // Pre-select role from ?role= query param (set by home page buttons)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'donor' || roleParam === 'recipient') {
      setForm((prev) => ({ ...prev, role: roleParam }));
    }
  }, [searchParams]);

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      return 'All basic fields are required.';
    }
    if (form.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Passwords do not match.';
    }
    if (form.role === 'donor') {
      if (!form.blood_group || !form.dob || !form.phone || !form.address) {
        return 'All donor profile fields are required.';
      }
    }
    if (form.role === 'recipient') {
      if (!form.phone || !form.address) {
        return 'Phone and address are required for hospital accounts.';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/auth/register', form);
      if (data.success) {
        setSuccess('Registration successful! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blood-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blood-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg animate-slide-up relative">
        <div className="card border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join BloodLink and save lives</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-emerald-900/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="reg-role" className="form-label">Register as</label>
                <select
                  id="reg-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-gray-800 capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="reg-confirm-password" className="form-label">Confirm Password</label>
                <div className="relative">
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Donor-specific fields ─────────────────────────────── */}
            {form.role === 'donor' && (
              <div className="p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-xl space-y-4">
                <p className="text-sm font-semibold text-emerald-400">Donor Profile</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-blood-group" className="form-label">Blood Group</label>
                    <select
                      id="reg-blood-group"
                      name="blood_group"
                      value={form.blood_group}
                      onChange={handleChange}
                      className="form-input"
                    >
                      <option value="" className="bg-gray-800">Select…</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg} className="bg-gray-800">{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-dob" className="form-label">Date of Birth</label>
                    <input
                      id="reg-dob"
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      className="form-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-donor-phone" className="form-label">Phone Number</label>
                  <input
                    id="reg-donor-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="reg-donor-address" className="form-label">Address</label>
                  <textarea
                    id="reg-donor-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Your full address"
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* ── Recipient-specific fields ─────────────────────────────── */}
            {form.role === 'recipient' && (
              <div className="p-4 bg-blue-900/20 border border-blue-800/40 rounded-xl space-y-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                  <p className="text-blue-300 text-sm">
                    <strong>Hospital / Recipient account</strong> — you will be able to request specific blood groups directly from your dashboard.
                  </p>
                </div>

                <div>
                  <label htmlFor="reg-recipient-phone" className="form-label">Contact Phone</label>
                  <input
                    id="reg-recipient-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Hospital contact number"
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="reg-recipient-address" className="form-label">Hospital Address</label>
                  <textarea
                    id="reg-recipient-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Full hospital / clinic address"
                    className="form-input"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* ── Admin-specific fields ─────────────────────────────── */}
            {form.role === 'admin' && (
              <div className="p-4 bg-purple-900/20 border border-purple-800/40 rounded-xl space-y-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-purple-400 text-lg">🛡️</span>
                  <p className="text-purple-300 text-sm">
                    <strong>Admin account</strong> — you will have full access to manage inventory, approve/reject requests, and manage donors. Note: In a production app, admin registration should be restricted.
                  </p>
                </div>
              </div>
            )}

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blood-400 hover:text-blood-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

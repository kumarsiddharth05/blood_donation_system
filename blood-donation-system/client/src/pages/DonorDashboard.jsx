import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import InventoryTable from '../components/InventoryTable';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:   'badge-pending',
    completed: 'badge-completed',
    rejected:  'badge-rejected',
  };
  return <span className={map[status] || 'badge-pending'}>{status}</span>;
};

const DonorDashboard = ({ activeTab = 'overview', onTabChange }) => {
  const { user } = useAuth();
  const donorId  = user?.profile_id;

  const [profile,   setProfile]   = useState(null);
  const [history,   setHistory]   = useState([]);
  const [inventory, setInventory] = useState([]);
  const [banks,     setBanks]     = useState([]);

  const [loading,  setLoading]  = useState(true);

  // Donate form state
  const [donateForm, setDonateForm] = useState({ bank_id: '', donation_date: '', units_donated: 1 });
  const [donateError, setDonateError]   = useState('');
  const [donateSuccess, setDonateSuccess] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [showDonateForm, setShowDonateForm] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!donorId) return;
    setLoading(true);
    try {
      const [profileRes, historyRes, inventoryRes, banksRes] = await Promise.all([
        api.get(`/donor/eligibility/${donorId}`),
        api.get(`/donor/history/${donorId}`),
        api.get('/donor/inventory'),
        api.get('/donor/banks'),
      ]);
      setProfile(profileRes.data.data);
      setHistory(historyRes.data.data);
      setInventory(inventoryRes.data.data);
      setBanks(banksRes.data.data);
    } catch (err) {
      console.error('DonorDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDonateChange = (e) => {
    setDonateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setDonateError('');
  };

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!donateForm.bank_id || !donateForm.donation_date) {
      setDonateError('Please select a bank and donation date.');
      return;
    }
    setDonateLoading(true);
    setDonateError('');
    setDonateSuccess('');
    try {
      const { data } = await api.post('/donor/donate', {
        donor_id:      donorId,
        bank_id:       Number(donateForm.bank_id),
        donation_date: donateForm.donation_date,
        units_donated: Number(donateForm.units_donated) || 1,
      });
      if (data.success) {
        setDonateSuccess('Donation registered! Awaiting admin approval.');
        setShowDonateForm(false);
        setDonateForm({ bank_id: '', donation_date: '', units_donated: 1 });
        fetchAll();
      } else {
        setDonateError(data.message);
      }
    } catch (err) {
      setDonateError(err.response?.data?.message || 'Error registering donation.');
    } finally {
      setDonateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blood-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome, <span className="text-blood-400">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Donor Dashboard — manage your donations and track your impact.</p>
      </div>

      {/* Eligibility & Summary Cards */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="stat-card">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Eligibility Status</p>
            <div className="mt-1 sm:mt-2">
              <span className={profile.is_eligible ? 'badge-eligible' : 'badge-ineligible'}>
                {profile.is_eligible ? '✓ Eligible to Donate' : '✕ Currently Ineligible'}
              </span>
            </div>
          </div>
          <div className="stat-card">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Blood Group</p>
            <p className="text-2xl sm:text-3xl font-bold text-blood-400 mt-1">{profile.blood_group}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Last Donation</p>
            <p className="text-base sm:text-lg font-semibold text-white mt-1">{formatDate(profile.last_donation_date)}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {donateSuccess && (
        <div className="mb-6 px-4 py-3 bg-emerald-900/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm">
          {donateSuccess}
        </div>
      )}



      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-200 flex items-center gap-2">
                Register a Donation
              </h2>
              <button
                id="show-donate-form-btn"
                onClick={() => setShowDonateForm(!showDonateForm)}
                className="btn-primary text-sm w-full sm:w-auto"
                disabled={profile && !profile.is_eligible}
              >
                {showDonateForm ? 'Cancel' : '+ Register Donation'}
              </button>
            </div>
            {profile && !profile.is_eligible && (
              <p className="text-sm text-amber-400">You are currently ineligible to donate. Please contact the blood bank or wait for eligibility to be restored by an admin.</p>
            )}

            {showDonateForm && (
              <form onSubmit={handleDonateSubmit} className="space-y-4 mt-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700 animate-slide-up">
                {donateError && (
                  <div className="px-3 py-2 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">{donateError}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="donate-bank" className="form-label">Blood Bank</label>
                    <select
                      id="donate-bank"
                      name="bank_id"
                      value={donateForm.bank_id}
                      onChange={handleDonateChange}
                      className="form-input"
                    >
                      <option value="" className="bg-gray-800">Select bank…</option>
                      {banks.map((b) => (
                        <option key={b.bank_id} value={b.bank_id} className="bg-gray-800">{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="donate-date" className="form-label">Donation Date</label>
                    <input
                      id="donate-date"
                      type="date"
                      name="donation_date"
                      value={donateForm.donation_date}
                      onChange={handleDonateChange}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label htmlFor="donate-units" className="form-label">Units</label>
                    <input
                      id="donate-units"
                      type="number"
                      name="units_donated"
                      value={donateForm.units_donated}
                      onChange={handleDonateChange}
                      className="form-input"
                      min={1}
                      max={3}
                    />
                  </div>
                </div>

                <button
                  id="donate-submit-btn"
                  type="submit"
                  disabled={donateLoading}
                  className="btn-primary"
                >
                  {donateLoading ? 'Submitting…' : 'Submit Donation'}
                </button>
              </form>
            )}
          </div>

          {/* Recent 3 donations */}
          <div className="card">
            <h2 className="section-title">Recent Donations</h2>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No donations yet. Register your first donation above!</p>
            ) : (
              <>
                {/* Mobile View: Stacked cards */}
                <div className="space-y-3 sm:hidden animate-slide-up">
                  {history.slice(0, 3).map((d) => (
                    <div key={d.donation_id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white text-sm">{d.bank_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">📅 {formatDate(d.donation_date)}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="border-t border-gray-800/60 pt-2 text-xs text-gray-400 flex justify-between items-center">
                        <span>Units Donated</span>
                        <span className="font-bold text-white">{d.units_donated}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Bank</th>
                        <th>Units</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 3).map((d) => (
                        <tr key={d.donation_id}>
                          <td>{formatDate(d.donation_date)}</td>
                          <td>{d.bank_name}</td>
                          <td>{d.units_donated}</td>
                          <td><StatusBadge status={d.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="card">
          <h2 className="section-title">📋 Full Donation History</h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No donation history found.</p>
          ) : (
            <>
              {/* Mobile View: Stacked cards */}
              <div className="space-y-3 sm:hidden animate-slide-up">
                {history.map((d, i) => (
                  <div key={d.donation_id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
                        <p className="font-semibold text-white text-sm mt-0.5">{d.bank_name}</p>
                        <p className="text-xs text-gray-500">📍 {d.bank_location || '—'}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="border-t border-gray-800/60 pt-2 text-xs text-gray-400 flex justify-between items-center">
                      <span>📅 {formatDate(d.donation_date)}</span>
                      <span>Units: <strong className="text-white">{d.units_donated}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden sm:block table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Bank</th>
                      <th>Location</th>
                      <th>Units</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((d, i) => (
                      <tr key={d.donation_id}>
                        <td className="text-gray-600">{i + 1}</td>
                        <td>{formatDate(d.donation_date)}</td>
                        <td>{d.bank_name}</td>
                        <td className="text-gray-500">{d.bank_location}</td>
                        <td>{d.units_donated}</td>
                        <td><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── INVENTORY TAB ────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div>
          <h2 className="section-title">🩸 Blood Inventory Across All Banks</h2>
          <InventoryTable inventory={inventory} />
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;

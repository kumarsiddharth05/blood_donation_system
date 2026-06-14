import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import RequestCard from '../components/RequestCard';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_OPTS = ['low', 'medium', 'high'];

const RecipientDashboard = ({ activeTab = 'requests', onTabChange }) => {
  const { user }       = useAuth();
  const recipientId    = user?.profile_id;

  const [profile,   setProfile]   = useState(null);
  const [requests,  setRequests]  = useState([]);
  const [banks,     setBanks]     = useState([]);
  const [matches,   setMatches]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    phone: '', address: '',
  });
  const [profileError,   setProfileError]   = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);

  // Request form state
  const [requestForm, setRequestForm] = useState({
    bank_id: '', blood_group: '', units_needed: 1, urgency: 'medium',
  });
  const [reqError,   setReqError]   = useState('');
  const [reqSuccess, setReqSuccess] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);

  // Match state
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError,   setMatchError]   = useState('');
  const [matchDone,    setMatchDone]    = useState(false);
  const [matchGroup,   setMatchGroup]   = useState('');

  const fetchAll = useCallback(async () => {
    if (!recipientId) return;
    setLoading(true);
    try {
      const [profileRes, reqRes, banksRes] = await Promise.all([
        api.get(`/recipient/profile/${recipientId}`),
        api.get(`/recipient/requests/${recipientId}`),
        api.get('/recipient/banks'),
      ]);
      const p = profileRes.data.data;
      setProfile(p);
      // Pre-fill profile form with existing values
      setProfileForm({
        phone:              p.phone              || '',
        address:            p.address            || '',
      });
      // If profile is incomplete, force Profile tab
      if (!p.phone || !p.address) {
        onTabChange && onTabChange('profile');
        setProfileEditing(true);
      }
      setRequests(reqRes.data.data);
      setBanks(banksRes.data.data);
    } catch (err) {
      console.error('RecipientDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Profile handlers ─────────────────────────────────────────────
  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.phone || !profileForm.address) {
      setProfileError('Phone and address are required.');
      return;
    }
    if (!/^\d{10}$/.test(profileForm.phone)) {
      setProfileError('Phone number must be exactly 10 digits.');
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const { data } = await api.put(`/recipient/profile/${recipientId}`, profileForm);
      if (data.success) {
        setProfileSuccess('Profile saved successfully!');
        setProfileEditing(false);
        fetchAll();
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.message);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Error saving profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Request handlers ─────────────────────────────────────────────
  const handleReqChange = (e) => {
    setRequestForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setReqError('');
  };

  const handleReqSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.bank_id || !requestForm.blood_group || !requestForm.units_needed) {
      setReqError('Bank, blood group, and units are required.');
      return;
    }
    setReqLoading(true);
    setReqError('');
    setReqSuccess('');
    try {
      const { data } = await api.post('/recipient/request', {
        recipient_id: recipientId,
        bank_id:      Number(requestForm.bank_id),
        blood_group:  requestForm.blood_group,
        units_needed: Number(requestForm.units_needed),
        urgency:      requestForm.urgency,
      });
      if (data.success) {
        setReqSuccess('Blood request submitted successfully!');
        setShowReqForm(false);
        setRequestForm({ bank_id: '', blood_group: '', units_needed: 1, urgency: 'medium' });
        fetchAll();
      } else {
        setReqError(data.message);
      }
    } catch (err) {
      setReqError(err.response?.data?.message || 'Error submitting request.');
    } finally {
      setReqLoading(false);
    }
  };

  const handleFindMatch = async () => {
    if (!matchGroup) {
      setMatchError('Please select a blood group to match.');
      return;
    }
    setMatchLoading(true);
    setMatchError('');
    setMatchDone(false);
    try {
      const { data } = await api.get(`/recipient/match/${recipientId}?group=${encodeURIComponent(matchGroup)}`);
      setMatches(data.data || []);
      setMatchDone(true);
    } catch (err) {
      setMatchError(err.response?.data?.message || 'Error finding matches.');
    } finally {
      setMatchLoading(false);
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

  const isProfileComplete = profile?.phone && profile?.address;
  const pendingCount  = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  const TABS = [
    { key: 'profile',  label: '🏥 My Profile' },
    { key: 'requests', label: '📋 My Requests' },
    { key: 'match',    label: '🔍 Find Banks' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome, <span className="text-blue-400">{user?.name}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Recipient Dashboard
          {profile?.blood_group_needed && (
            <span className="ml-2 px-2 py-0.5 bg-blood-900/40 border border-blood-800/50 rounded-lg text-blood-300 text-xs font-semibold">
              Needs: {profile.blood_group_needed}
            </span>
          )}
        </p>
      </div>

      {/* Profile incomplete warning */}
      {!isProfileComplete && (
        <div className="mb-6 px-4 py-3 bg-amber-900/40 border border-amber-700/50 rounded-xl text-amber-300 text-sm flex items-center gap-2">
          ⚠️ <span>Your profile is incomplete. Please fill in your hospital details below before making blood requests.</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Requests</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{requests.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Pending</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Approved</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* Global success */}
      {reqSuccess && (
        <div className="mb-6 px-4 py-3 bg-emerald-900/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm">
          {reqSuccess}
        </div>
      )}



      {/* ── PROFILE TAB ───────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="card max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">🏥 Hospital / Recipient Profile</h2>
            {isProfileComplete && !profileEditing && (
              <button
                id="edit-profile-btn"
                onClick={() => setProfileEditing(true)}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {/* View mode */}
          {isProfileComplete && !profileEditing ? (
            <div className="space-y-4">
              {[
                { label: 'Hospital / Org Name', value: profile.name },
                { label: 'Email', value: profile.email },
                { label: 'Phone', value: profile.phone },
                { label: 'Address', value: profile.address },
              ].map(({ label, value, badge }) => (
                <div key={label} className="flex gap-4 py-2 border-b border-gray-800">
                  <p className="text-gray-500 text-sm w-44 shrink-0">{label}</p>
                  {badge ? (
                    <span className="blood-group-badge">{value}</span>
                  ) : (
                    <p className="text-white text-sm">{value}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Edit / Fill mode */
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {!isProfileComplete && (
                <p className="text-sm text-blue-300 bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  Fill in your hospital details to start making blood requests.
                </p>
              )}

              {profileError && (
                <div className="px-3 py-2 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="px-3 py-2 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm">{profileSuccess}</div>
              )}



              <div>
                <label htmlFor="profile-phone" className="form-label">Contact Phone</label>
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  placeholder="10-digit contact number"
                  className="form-input"
                  pattern="\d{10}"
                  maxLength={10}
                  minLength={10}
                />
              </div>

              <div>
                <label htmlFor="profile-address" className="form-label">Hospital Address</label>
                <textarea
                  id="profile-address"
                  name="address"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  placeholder="Full hospital / clinic address"
                  className="form-input"
                  rows={3}
                />
              </div>



              <div className="flex gap-3">
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary flex-1"
                >
                  {profileLoading ? 'Saving…' : 'Save Profile'}
                </button>
                {isProfileComplete && (
                  <button
                    type="button"
                    onClick={() => { setProfileEditing(false); setProfileError(''); }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── REQUESTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {!isProfileComplete && (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🏥</p>
              <p className="text-gray-400 mb-3">Complete your profile before making blood requests.</p>
              <button onClick={() => onTabChange && onTabChange('profile')} className="btn-primary text-sm">
                Complete Profile →
              </button>
            </div>
          )}

          {isProfileComplete && (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">Request Blood</h2>
                  <button
                    id="show-request-form-btn"
                    onClick={() => setShowReqForm(!showReqForm)}
                    className="btn-primary text-sm"
                  >
                    {showReqForm ? 'Cancel' : '+ New Request'}
                  </button>
                </div>

                {showReqForm && (
                  <form onSubmit={handleReqSubmit} className="space-y-4 mt-2 p-4 bg-gray-800/60 rounded-xl border border-gray-700 animate-slide-up">
                    {reqError && (
                      <div className="px-3 py-2 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">{reqError}</div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="req-bank" className="form-label">Blood Bank</label>
                        <select id="req-bank" name="bank_id" value={requestForm.bank_id} onChange={handleReqChange} className="form-input">
                          <option value="" className="bg-gray-800">Select bank…</option>
                          {banks.map((b) => (
                            <option key={b.bank_id} value={b.bank_id} className="bg-gray-800">{b.name} — {b.location}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="req-blood-group" className="form-label">Blood Group Needed</label>
                        <select id="req-blood-group" name="blood_group" value={requestForm.blood_group} onChange={handleReqChange} className="form-input">
                          <option value="" className="bg-gray-800">Select…</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg} className="bg-gray-800">{bg}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="req-units" className="form-label">Units Needed</label>
                        <input
                          id="req-units"
                          type="number"
                          name="units_needed"
                          value={requestForm.units_needed}
                          onChange={handleReqChange}
                          className="form-input"
                          min={1}
                          max={10}
                        />
                      </div>

                      <div>
                        <label htmlFor="req-urgency" className="form-label">Urgency</label>
                        <select id="req-urgency" name="urgency" value={requestForm.urgency} onChange={handleReqChange} className="form-input">
                          {URGENCY_OPTS.map((u) => (
                            <option key={u} value={u} className="bg-gray-800 capitalize">{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button id="submit-request-btn" type="submit" disabled={reqLoading} className="btn-primary">
                      {reqLoading ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </form>
                )}
              </div>

              {requests.length === 0 ? (
                <div className="card text-center py-12 text-gray-500">
                  <p className="text-4xl mb-3">🩸</p>
                  <p>No requests yet. Submit your first blood request above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.map((req) => (
                    <RequestCard key={req.request_id} request={req} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MATCH TAB ────────────────────────────────────────────────── */}
      {activeTab === 'match' && (
        <div className="space-y-6">
          {!isProfileComplete ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400 mb-3">Complete your hospital profile to access the blood matching engine.</p>
              <button onClick={() => onTabChange && onTabChange('profile')} className="btn-primary text-sm">Complete Profile →</button>
            </div>
          ) : (
            <div className="card">
              <h2 className="section-title">🔍 Find Compatible Blood Banks</h2>
              <p className="text-sm text-gray-500 mb-4">
                Select a blood group below to instantly find compatible blood banks using the full ABO + Rh compatibility matrix.
              </p>

              {matchError && (
                <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">{matchError}</div>
              )}

              <div className="flex gap-4 mb-6 max-w-md">
                <select
                  className="form-input"
                  value={matchGroup}
                  onChange={(e) => { setMatchGroup(e.target.value); setMatchError(''); setMatchDone(false); }}
                >
                  <option value="" className="bg-gray-800">Select blood group needed…</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg} className="bg-gray-800">{bg}</option>
                  ))}
                </select>

                <button
                  id="find-match-btn"
                  onClick={handleFindMatch}
                  disabled={matchLoading}
                  className="btn-primary whitespace-nowrap"
                >
                  {matchLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching…
                    </span>
                  ) : '🔍 Find Banks'}
                </button>
              </div>

              {matchDone && (
                <div className="mt-6 animate-slide-up">
                  <h3 className="section-title">Results ({matches.length} found)</h3>
                  {matches.length === 0 ? (
                    <p className="text-gray-500">No compatible blood available right now. Please try again later.</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Bank Name</th>
                            <th>Location</th>
                            <th>Phone</th>
                            <th>Available Blood</th>
                            <th>Units</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((m, i) => (
                            <tr key={i}>
                              <td className="font-medium text-white">{m.bank_name}</td>
                              <td>{m.location}</td>
                              <td>{m.bank_phone}</td>
                              <td><span className="blood-group-badge">{m.available_blood_group}</span></td>
                              <td>
                                <span className={`font-bold ${m.units_available < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {m.units_available}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipientDashboard;

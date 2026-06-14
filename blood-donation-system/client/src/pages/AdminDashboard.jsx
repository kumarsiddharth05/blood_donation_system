import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import InventoryTable from '../components/InventoryTable';
import RequestCard from '../components/RequestCard';
import DonorCard from '../components/DonorCard';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    pending:   'badge-pending',
    completed: 'badge-completed',
    approved:  'badge-approved',
    rejected:  'badge-rejected',
  };
  return <span className={map[status] || 'badge-pending'}>{status}</span>;
};

const SummaryCard = ({ label, value, color, icon }) => (
  <div className="stat-card group cursor-default">
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-4xl font-bold mt-2 ${color}`}>{value ?? '—'}</p>
  </div>
);

const TABS = ['overview', 'inventory', 'requests', 'donors', 'donations'];

const AdminDashboard = () => {
  const [summary,   setSummary]   = useState(null);
  const [inventory, setInventory] = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [donors,    setDonors]    = useState([]);
  const [donations, setDonations] = useState([]);

  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Inventory edit modal state
  const [editRow,      setEditRow]      = useState(null);
  const [editUnits,    setEditUnits]    = useState('');
  const [editLoading,  setEditLoading]  = useState(false);
  const [editError,    setEditError]    = useState('');

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summRes, invRes, reqRes, donorRes, donRes] = await Promise.all([
        api.get('/admin/reports/summary'),
        api.get('/admin/inventory'),
        api.get('/admin/requests'),
        api.get('/admin/donors'),
        api.get('/admin/donations'),
      ]);
      setSummary(summRes.data.data);
      setInventory(invRes.data.data);
      setRequests(reqRes.data.data);
      setDonors(donorRes.data.data);
      setDonations(donRes.data.data);
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Inventory edit ────────────────────────────────────────────────
  const openEditModal = (row) => {
    setEditRow(row);
    setEditUnits(String(row.units_available));
    setEditError('');
  };

  const handleInventoryUpdate = async (e) => {
    e.preventDefault();
    const units = Number(editUnits);
    if (isNaN(units) || units < 0) { setEditError('Enter a valid non-negative number.'); return; }
    setEditLoading(true);
    try {
      const { data } = await api.put('/admin/inventory/update', {
        inventory_id:    editRow.inventory_id,
        units_available: units,
      });
      if (data.success) {
        setEditRow(null);
        showToast('Inventory updated successfully!');
        fetchAll();
      } else {
        setEditError(data.message);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Request status update ─────────────────────────────────────────
  const handleRequestStatus = async (requestId, status) => {
    try {
      const { data } = await api.put(`/admin/requests/${requestId}/status`, { status });
      if (data.success) {
        showToast(`Request ${status} successfully!`);
        fetchAll();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.');
    }
  };

  // ── Donation status update ────────────────────────────────────────
  const handleDonationStatus = async (donationId, status) => {
    try {
      const { data } = await api.put(`/admin/donations/${donationId}/status`, { status });
      if (data.success) {
        showToast(`Donation marked as ${status}!`);
        fetchAll();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.');
    }
  };

  // ── Donor eligibility toggle ──────────────────────────────────────
  const handleToggleEligibility = async (donorId, newEligibility) => {
    try {
      const { data } = await api.put(`/admin/donors/${donorId}/eligibility`, { is_eligible: newEligibility });
      if (data.success) {
        showToast(`Donor eligibility updated!`);
        fetchAll();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 px-5 py-3 bg-gray-800 border border-emerald-700/50 text-emerald-300 rounded-xl shadow-2xl animate-slide-up text-sm">
          ✓ {toastMsg}
        </div>
      )}

      {/* Inventory Edit Modal */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-sm animate-slide-up border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Edit Inventory — <span className="text-blood-400">{editRow.blood_group}</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">{editRow.bank_name} · {editRow.location}</p>
            {editError && (
              <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">{editError}</div>
            )}
            <form onSubmit={handleInventoryUpdate} className="space-y-4">
              <div>
                <label className="form-label">Units Available</label>
                <input
                  type="number"
                  value={editUnits}
                  onChange={(e) => setEditUnits(e.target.value)}
                  className="form-input"
                  min={0}
                  id="edit-units-input"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={editLoading} className="btn-primary flex-1">
                  {editLoading ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditRow(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Admin <span className="text-purple-400">Control Panel</span>
        </h1>
        <p className="text-gray-500 mt-1">Manage blood inventory, requests, donations, and donors.</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <SummaryCard label="Total Donors"     value={summary.total_donors}        color="text-emerald-400" icon="🩸" />
          <SummaryCard label="Recipients"        value={summary.total_recipients}    color="text-blue-400"   icon="🏥" />
          <SummaryCard label="Donations"         value={summary.total_donations}     color="text-purple-400" icon="💉" />
          <SummaryCard label="Completed"         value={summary.completed_donations} color="text-teal-400"   icon="✓" />
          <SummaryCard label="Pending Requests"  value={summary.pending_requests}    color="text-amber-400"  icon="⏳" />
          <SummaryCard label="Low Inventory"     value={summary.low_inventory_count} color="text-red-400"    icon="⚠️" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((tab) => {
          const labels = {
            overview: '📊 Overview', inventory: '🩸 Inventory',
            requests: '📋 Requests', donors: '👤 Donors', donations: '💉 Donations',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-purple-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
              id={`admin-tab-${tab}`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent requests */}
          <div className="card">
            <h2 className="section-title">Recent Requests</h2>
            {requests.slice(0, 4).map((r) => (
              <RequestCard
                key={r.request_id}
                request={r}
                showActions
                showRecipient
                onApprove={(id) => handleRequestStatus(id, 'approved')}
                onReject={(id) => handleRequestStatus(id, 'rejected')}
              />
            ))}
            {requests.length === 0 && <p className="text-gray-500 text-sm">No requests found.</p>}
          </div>

          {/* Recent donations */}
          <div className="card">
            <h2 className="section-title">Recent Donations</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Blood</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 6).map((d) => (
                    <tr key={d.donation_id}>
                      <td className="font-medium text-white">{d.donor_name}</td>
                      <td><span className="blood-group-badge">{d.blood_group}</span></td>
                      <td>{formatDate(d.donation_date)}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        {d.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              id={`complete-don-${d.donation_id}`}
                              onClick={() => handleDonationStatus(d.donation_id, 'completed')}
                              className="text-xs btn-success py-1 px-2"
                            >Done</button>
                            <button
                              id={`reject-don-${d.donation_id}`}
                              onClick={() => handleDonationStatus(d.donation_id, 'rejected')}
                              className="text-xs btn-danger py-1 px-2"
                            >Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {donations.length === 0 && <p className="text-gray-500 text-sm mt-2">No donations found.</p>}
          </div>
        </div>
      )}

      {/* ── INVENTORY TAB ────────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div>
          <h2 className="section-title">🩸 Blood Inventory Management</h2>
          <InventoryTable inventory={inventory} editable onEdit={openEditModal} />
        </div>
      )}

      {/* ── REQUESTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="section-title">📋 All Blood Requests ({requests.length})</h2>
          {requests.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">No requests found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <RequestCard
                  key={r.request_id}
                  request={r}
                  showActions
                  showRecipient
                  onApprove={(id) => handleRequestStatus(id, 'approved')}
                  onReject={(id) => handleRequestStatus(id, 'rejected')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DONORS TAB ───────────────────────────────────────────────── */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          <h2 className="section-title">👤 All Donors ({donors.length})</h2>
          {donors.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">No donors found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donors.map((d) => (
                <DonorCard
                  key={d.donor_id}
                  donor={d}
                  showActions
                  onToggleEligibility={handleToggleEligibility}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DONATIONS TAB ────────────────────────────────────────────── */}
      {activeTab === 'donations' && (
        <div className="card">
          <h2 className="section-title">💉 All Donations ({donations.length})</h2>
          {donations.length === 0 ? (
            <p className="text-gray-500 text-sm">No donations found.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Donor</th>
                    <th>Blood Group</th>
                    <th>Bank</th>
                    <th>Date</th>
                    <th>Units</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, i) => (
                    <tr key={d.donation_id}>
                      <td className="text-gray-600">{i + 1}</td>
                      <td>
                        <div>
                          <p className="text-white font-medium">{d.donor_name}</p>
                          <p className="text-gray-600 text-xs">{d.donor_email}</p>
                        </div>
                      </td>
                      <td><span className="blood-group-badge">{d.blood_group}</span></td>
                      <td>
                        <div>
                          <p>{d.bank_name}</p>
                          <p className="text-gray-600 text-xs">{d.bank_location}</p>
                        </div>
                      </td>
                      <td>{formatDate(d.donation_date)}</td>
                      <td>{d.units_donated}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td>
                        {d.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              id={`complete-don-full-${d.donation_id}`}
                              onClick={() => handleDonationStatus(d.donation_id, 'completed')}
                              className="text-xs btn-success py-1 px-2"
                            >Complete</button>
                            <button
                              id={`reject-don-full-${d.donation_id}`}
                              onClick={() => handleDonationStatus(d.donation_id, 'rejected')}
                              className="text-xs btn-danger py-1 px-2"
                            >Reject</button>
                          </div>
                        )}
                        {d.status !== 'pending' && (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
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
  );
};

export default AdminDashboard;

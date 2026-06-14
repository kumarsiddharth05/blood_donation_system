import React from 'react';

const bloodGroupColors = {
  'A+':  'bg-red-900/60 text-red-300 border-red-700/50',
  'A-':  'bg-rose-900/60 text-rose-300 border-rose-700/50',
  'B+':  'bg-orange-900/60 text-orange-300 border-orange-700/50',
  'B-':  'bg-amber-900/60 text-amber-300 border-amber-700/50',
  'AB+': 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  'AB-': 'bg-violet-900/60 text-violet-300 border-violet-700/50',
  'O+':  'bg-blue-900/60 text-blue-300 border-blue-700/50',
  'O-':  'bg-cyan-900/60 text-cyan-300 border-cyan-700/50',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * DonorCard — displays a donor's profile summary card.
 *
 * @param {object}   donor           - donor data object (includes user fields)
 * @param {boolean}  showActions     - whether to show toggle eligibility button
 * @param {Function} onToggleEligibility - callback(donor_id, is_eligible)
 */
const DonorCard = ({ donor, showActions = false, onToggleEligibility }) => {
  const bgColor = bloodGroupColors[donor.blood_group] || 'bg-gray-800 text-gray-300 border-gray-700';

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 sm:p-5 hover:border-gray-600 transition-all duration-200 animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-lg ${bgColor}`}>
          {donor.blood_group}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{donor.name}</p>
          <p className="text-gray-500 text-sm truncate">{donor.email}</p>
        </div>
        <span className={donor.is_eligible ? 'badge-eligible' : 'badge-ineligible'}>
          {donor.is_eligible ? '✓ Eligible' : '✕ Ineligible'}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <span>📞</span>
          <span>{donor.phone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>🎂</span>
          <span>{formatDate(donor.dob)}</span>
        </div>
        <div className="flex items-start gap-1.5 col-span-2">
          <span className="mt-0.5">📍</span>
          <span className="break-words">{donor.address}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2 mt-0.5">
          <span>💉</span>
          <span>Last donated: {formatDate(donor.last_donation_date)}</span>
        </div>
      </div>

      {/* Admin eligibility toggle */}
      {showActions && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => onToggleEligibility && onToggleEligibility(donor.donor_id, !donor.is_eligible)}
            className={donor.is_eligible ? 'btn-danger w-full text-sm' : 'btn-success w-full text-sm'}
            id={`toggle-eligibility-${donor.donor_id}`}
          >
            {donor.is_eligible ? '✕ Mark Ineligible' : '✓ Mark Eligible'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DonorCard;

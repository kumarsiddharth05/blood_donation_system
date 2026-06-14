import React from 'react';

const urgencyConfig = {
  high:   { label: 'High',   class: 'bg-red-900/60 text-red-300 border-red-700/50',     dot: 'bg-red-400' },
  medium: { label: 'Medium', class: 'bg-amber-900/60 text-amber-300 border-amber-700/50', dot: 'bg-amber-400' },
  low:    { label: 'Low',    class: 'bg-blue-900/60 text-blue-300 border-blue-700/50',   dot: 'bg-blue-400' },
};

const statusConfig = {
  pending:  { label: 'Pending',  class: 'badge-pending' },
  approved: { label: 'Approved', class: 'badge-approved' },
  rejected: { label: 'Rejected', class: 'badge-rejected' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * RequestCard — displays a single blood request's details.
 *
 * @param {object}   request         - blood request data object
 * @param {boolean}  showActions     - whether to show approve/reject buttons
 * @param {Function} onApprove       - callback when approve is clicked
 * @param {Function} onReject        - callback when reject is clicked
 * @param {boolean}  showRecipient   - whether to show recipient name/email (admin view)
 */
const RequestCard = ({
  request,
  showActions = false,
  onApprove,
  onReject,
  showRecipient = false,
}) => {
  const urgency = urgencyConfig[request.urgency] || urgencyConfig.medium;
  const status  = statusConfig[request.status]   || statusConfig.pending;

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 hover:border-gray-600 transition-all duration-200 animate-slide-up">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blood-900/60 border border-blood-700/50 flex items-center justify-center font-bold text-blood-300">
            {request.blood_group}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{request.units_needed} unit{request.units_needed !== 1 ? 's' : ''}</span>
              <span className="text-gray-500">of</span>
              <span className="text-blood-400 font-bold">{request.blood_group}</span>
            </div>
            {showRecipient && request.recipient_name && (
              <div className="text-xs mt-2 space-y-1 bg-gray-900/30 border border-gray-800/40 p-2.5 rounded-xl">
                <div className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>{request.recipient_name}</span>
                </div>
                <div className="text-gray-500 flex items-center gap-1.5 pl-5">
                  <span>✉️</span>
                  <span>{request.recipient_email}</span>
                </div>
                {request.recipient_phone && (
                  <div className="text-gray-400 flex items-center gap-1.5 pl-5">
                    <span>📞</span>
                    <span>{request.recipient_phone}</span>
                  </div>
                )}
                {request.recipient_address && (
                  <div className="text-gray-400 flex items-start gap-1.5 pl-5">
                    <span className="mt-0.5">📍</span>
                    <span className="break-all">{request.recipient_address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <span className={status.class}>{status.label}</span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <span>🏥</span>
          <span>{request.bank_name}</span>
          {request.bank_location && <span className="text-gray-600">· {request.bank_location}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{formatDate(request.requested_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span className="text-gray-400">Urgency:</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${urgency.class}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
            {urgency.label}
          </span>
        </div>
      </div>

      {/* Action buttons (admin view) */}
      {showActions && request.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={() => onApprove && onApprove(request.request_id)}
            className="btn-success flex-1 text-sm"
            id={`approve-req-${request.request_id}`}
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onReject && onReject(request.request_id)}
            className="btn-danger flex-1 text-sm"
            id={`reject-req-${request.request_id}`}
          >
            ✕ Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestCard;

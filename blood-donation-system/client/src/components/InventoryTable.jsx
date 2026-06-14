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

const getStockLevel = (units) => {
  if (units === 0)  return { label: 'Out of Stock', color: 'text-red-400',   bar: 'bg-red-600',     width: 'w-0' };
  if (units < 5)   return { label: 'Critical',     color: 'text-red-400',   bar: 'bg-red-500',     width: `w-[${Math.min(units * 10, 100)}%]` };
  if (units < 10)  return { label: 'Low',          color: 'text-amber-400', bar: 'bg-amber-500',   width: `w-[${Math.min(units * 7, 100)}%]` };
  if (units < 20)  return { label: 'Moderate',     color: 'text-yellow-400', bar: 'bg-yellow-500', width: `w-[${Math.min(units * 5, 100)}%]` };
  return           { label: 'Good',               color: 'text-emerald-400', bar: 'bg-emerald-500', width: 'w-full' };
};

/**
 * InventoryTable — displays blood inventory grouped by bank.
 *
 * @param {Array}  inventory - array of inventory rows from the API
 * @param {boolean} editable - if true, shows an edit button per row
 * @param {Function} onEdit  - callback(row) when edit is clicked
 */
const InventoryTable = ({ inventory = [], editable = false, onEdit }) => {
  if (inventory.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-3">🩸</p>
        <p>No inventory data available.</p>
      </div>
    );
  }

  // Group by bank name for display
  const grouped = inventory.reduce((acc, row) => {
    const bankKey = row.bank_name;
    if (!acc[bankKey]) acc[bankKey] = { location: row.location, items: [] };
    acc[bankKey].items.push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([bankName, { location, items }]) => (
        <div key={bankName} className="card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white">{bankName}</h3>
              <p className="text-sm text-gray-500 mt-0.5">📍 {location}</p>
            </div>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700">
              {items.length} blood groups
            </span>
          </div>

          {/* Card grid for blood groups */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((row) => {
              const stock = getStockLevel(row.units_available);
              const bgColor = bloodGroupColors[row.blood_group] || 'bg-gray-800 text-gray-300 border-gray-700';
              return (
                <div
                  key={row.inventory_id}
                  className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-gray-600 transition-colors"
                >
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full border font-bold text-base ${bgColor}`}>
                    {row.blood_group}
                  </span>
                  <span className="text-2xl font-bold text-white">{row.units_available}</span>
                  <span className="text-xs text-gray-500">units</span>
                  <span className={`text-xs font-medium ${stock.color}`}>{stock.label}</span>
                  {editable && (
                    <button
                      onClick={() => onEdit && onEdit(row)}
                      className="mt-1 text-xs btn-secondary py-1 px-3"
                      id={`edit-inv-${row.inventory_id}`}
                    >
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryTable;

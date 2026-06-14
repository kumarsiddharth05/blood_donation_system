import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * BottomTabBar — Fixed bottom navigation for mobile-native feel.
 * Shows role-specific tabs based on the logged-in user's role.
 * Hidden on public pages (login, register, home).
 */

const DONOR_TABS = [
  { key: 'overview',  icon: '📋', label: 'Overview' },
  { key: 'history',   icon: '💉', label: 'History' },
  { key: 'inventory', icon: '🩸', label: 'Inventory' },
];

const RECIPIENT_TABS = [
  { key: 'profile',  icon: '🏥', label: 'Profile' },
  { key: 'requests', icon: '📋', label: 'Requests' },
  { key: 'match',    icon: '🔍', label: 'Find Banks' },
];

const ADMIN_TABS = [
  { key: 'overview',   icon: '📊', label: 'Overview' },
  { key: 'inventory',  icon: '🩸', label: 'Inventory' },
  { key: 'requests',   icon: '📋', label: 'Requests' },
  { key: 'donors',     icon: '👤', label: 'Donors' },
  { key: 'donations',  icon: '💉', label: 'Donations' },
];

const BottomTabBar = ({ activeTab, onTabChange }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user?.role) return null;

  let tabs;
  let activeColor;
  if (user.role === 'donor') {
    tabs = DONOR_TABS;
    activeColor = 'text-blood-400';
  } else if (user.role === 'recipient') {
    tabs = RECIPIENT_TABS;
    activeColor = 'text-blue-400';
  } else if (user.role === 'admin') {
    tabs = ADMIN_TABS;
    activeColor = 'text-purple-400';
  } else {
    return null;
  }

  return (
    <nav className="btm-tab-bar" id="bottom-tab-bar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`btm-tab-item ${isActive ? activeColor : 'text-gray-500'}`}
            id={`btm-tab-${tab.key}`}
          >
            <span className={`text-lg sm:text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className={`text-[10px] sm:text-xs font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;

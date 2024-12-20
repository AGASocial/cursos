import React from 'react';
import { FormattedMessage } from 'react-intl';

interface OrdersTabsProps {
  activeTab: 'pending' | 'completed';
  onTabChange: (tab: 'pending' | 'completed') => void;
}

export const OrdersTabs: React.FC<OrdersTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-6 flex space-x-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
      <button
        onClick={() => onTabChange('pending')}
        className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'pending'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
            : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
        }`}
      >
        <FormattedMessage id="orders.tabs.pending" />
      </button>
      <button
        onClick={() => onTabChange('completed')}
        className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'completed'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
            : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
        }`}
      >
        <FormattedMessage id="orders.tabs.completed" />
      </button>
    </div>
  );
};
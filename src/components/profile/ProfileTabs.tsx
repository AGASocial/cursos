import React from 'react';
import { FormattedMessage } from 'react-intl';

interface ProfileTabsProps {
  activeTab: 'basic' | 'security';
  onTabChange: (tab: 'basic' | 'security') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-6 flex space-x-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
      <button
        onClick={() => onTabChange('basic')}
        className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'basic'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
            : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
        }`}
      >
        <FormattedMessage id="profile.tabs.basic" />
      </button>
      <button
        onClick={() => onTabChange('security')}
        className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'security'
            ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
            : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
        }`}
      >
        <FormattedMessage id="profile.tabs.security" />
      </button>
    </div>
  );
};
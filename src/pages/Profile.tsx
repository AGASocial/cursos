import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BasicInfoForm } from '../components/profile/BasicInfoForm';
import { SecurityForm } from '../components/profile/SecurityForm';
import { ProfileTabs } from '../components/profile/ProfileTabs';

type TabType = 'basic' | 'security';

export const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  const handleProfileUpdate = () => {
    // Refresh the page to show updated profile
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              <FormattedMessage id="profile.title" />
            </h1>
          </div>

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            {activeTab === 'basic' ? (
              <BasicInfoForm user={user} onSuccess={handleProfileUpdate} />
            ) : (
              <SecurityForm />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
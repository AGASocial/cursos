import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { User, Receipt, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { success } = await signOut();
    if (success) {
      navigate('/');
    }
  };

  const hasProfileImage = user?.photoURL;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-200 transition-all duration-200"
      >
        {hasProfileImage ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-indigo-100">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-48 rounded-lg bg-white p-2 shadow-lg ring-1 ring-black/5">
            <Link
              to="/profile"
              className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              <span><FormattedMessage id="nav.profile" /></span>
            </Link>
            <Link
              to="/orders"
              className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
              onClick={() => setIsOpen(false)}
            >
              <Receipt className="h-4 w-4" />
              <span><FormattedMessage id="nav.orders" /></span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-2 rounded-md px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span><FormattedMessage id="nav.signout" /></span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
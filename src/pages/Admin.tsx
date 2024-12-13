import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Plus, BookOpen, ShoppingCart } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../lib/admin';
import { AdminCoursesList } from '../components/admin/AdminCoursesList';
import { AdminOrdersList } from '../components/admin/AdminOrdersList';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'orders'>('courses');

  // Redirect if not admin
  if (!user || !isAdmin(user.email!)) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl transform transition-transform hover:scale-105">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <FormattedMessage id="admin.title" />
              </h1>
              <p className="text-base text-gray-600">
                <FormattedMessage id="admin.subtitle" />
              </p>
            </div>
          </div>
          {activeTab === 'courses' && (
            <Link to="/admin/courses/new">
              <Button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                <Plus className="h-4 w-4" />
                <span><FormattedMessage id="admin.courses.new" /></span>
              </Button>
            </Link>
          )}
        </div>

        <div className="mb-6">
          <nav className="flex space-x-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'courses'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span><FormattedMessage id="admin.courses.tab" /></span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span><FormattedMessage id="admin.orders.tab" /></span>
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
          {activeTab === 'courses' ? <AdminCoursesList /> : <AdminOrdersList />}
        </div>
      </div>
    </div>
  );
};
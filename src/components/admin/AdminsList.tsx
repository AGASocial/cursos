import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { getAllAdmins, addAdmin, removeAdmin } from '../../lib/admin';
import { useAuth } from '../../contexts/AuthContext';

export const AdminsList = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<{ id: string; email: string; displayName?: string; photoURL?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string; displayName?: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const fetchedAdmins = await getAllAdmins();
    setAdmins(fetchedAdmins);
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAddingAdmin(true);

    const { success, error } = await addAdmin(newAdminEmail);

    if (success) {
      setSuccess('admin.success.added');
      setNewAdminEmail('');
      await fetchAdmins();
    } else {
      setError(error || 'admin.error.addFailed');
    }

    setAddingAdmin(false);
  };

  const handleDeleteClick = (admin: { id: string; email: string }) => {
    setAdminToDelete(admin);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete || !user) return;
    
    setRemovingAdmin(true);
    const { success, error } = await removeAdmin(adminToDelete.id, user.uid);
    
    if (success) {
      await fetchAdmins();
      setAdminToDelete(null);
    } else {
      setError(error || 'admin.error.removeFailed');
    }
    setRemovingAdmin(false);
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">
          <FormattedMessage id="admin.loading" />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add New Admin Form */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <FormattedMessage id="admin.addNew" />
        </h3>
        <form onSubmit={handleAddAdmin} className="space-y-4">
          <Input
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />
          {error && (
            <p className="text-sm text-red-600">
              <FormattedMessage id={error} />
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600">
              <FormattedMessage id={success} />
            </p>
          )}
          <Button
            type="submit"
            disabled={addingAdmin}
            className="flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>
              {addingAdmin ? (
                <FormattedMessage id="admin.adding" />
              ) : (
                <FormattedMessage id="admin.add" />
              )}
            </span>
          </Button>
        </form>
      </div>

      {/* Admins List */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            <FormattedMessage id="admin.list.title" />
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-indigo-100">
                  {admin.photoURL ? (
                    <img
                      src={admin.photoURL}
                      alt={admin.displayName || admin.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Shield className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900">
                    {admin.displayName || admin.email}
                  </span>
                  {admin.displayName && (
                    <span className="text-sm text-gray-500 border-l border-gray-200 pl-4">{admin.email}</span>
                  )}
                </div>
              </div>
              {admin.id !== user?.uid && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteClick(admin)}
                  className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  <span><FormattedMessage id="admin.remove" /></span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <ConfirmationModal
        isOpen={adminToDelete !== null}
        onClose={() => setAdminToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={<FormattedMessage id="admin.remove.title" />}
        message={<FormattedMessage 
          id="admin.remove.message" 
          values={{ email: adminToDelete?.email }}
        />}
        confirmText={<FormattedMessage id="admin.remove" />}
        cancelText={<FormattedMessage id="admin.remove.cancel" />}
        loading={removingAdmin}
      />
    </div>
  );
};
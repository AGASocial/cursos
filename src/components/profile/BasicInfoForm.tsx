import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { User, Camera } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { updateUserProfile } from '../../lib/users';

interface BasicInfoFormProps {
  user: any;
  onSuccess: () => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    photoFile: null as File | null,
  });
  const [previewUrl, setPreviewUrl] = useState<string>(user?.photoURL || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, photoFile: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name && !formData.photoFile) {
      setError('profile.update.noChanges');
      setLoading(false);
      return;
    }

    const { success, error } = await updateUserProfile({
      displayName: formData.name,
      photoFile: formData.photoFile,
    });

    if (success) {
      setSuccess('profile.update.success');
      setFormData({ ...formData, photoFile: null });
      // Update the user object directly instead of reloading
      if (user) {
        user.displayName = formData.name;
        if (previewUrl) {
          user.photoURL = previewUrl;
        }
      }
    } else {
      setError(error || 'profile.update.error');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          <label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
          >
            <Camera className="h-4 w-4" />
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      <Input
        label={<FormattedMessage id="profile.name" />}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
        label={<FormattedMessage id="profile.email" />}
        value={user?.email || ''}
        disabled
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
      <Button type="submit" disabled={loading}>
        {loading ? (
          <FormattedMessage id="profile.saving" />
        ) : (
          <FormattedMessage id="profile.save" />
        )}
      </Button>
    </form>
  );
};
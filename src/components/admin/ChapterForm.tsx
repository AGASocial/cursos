import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { createChapter, updateChapter } from '../../lib/chapters';

interface ChapterFormProps {
  courseId: string;
  onSuccess: () => void;
  initialData?: {
    id: string;
    title: string;
    content: string;
    order: number;
  };
}

export const ChapterForm: React.FC<ChapterFormProps> = ({
  courseId,
  onSuccess,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    order: initialData?.order || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = initialData
        ? await updateChapter(courseId, initialData.id, formData)
        : await createChapter(courseId, formData);

      if (!result.success) {
        setError(result.error || 'Failed to save chapter');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Chapter Title"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Content (Markdown)
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={12}
          required
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="# Chapter Title&#10;&#10;## Section 1&#10;&#10;Content goes here..."
        />
      </div>

      <Input
        label="Order"
        type="number"
        min="0"
        required
        value={formData.order}
        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) })}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Chapter' : 'Create Chapter'}
        </Button>
      </div>
    </form>
  );
};
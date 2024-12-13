import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { createChapter, updateChapter, getChapter } from '../../lib/chapters';

interface ChapterFormProps {
  courseId: string;
  chapterId?: string;
  onSuccess: () => void;
}

export const ChapterForm: React.FC<ChapterFormProps> = ({
  courseId,
  chapterId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      
      const chapter = await getChapter(courseId, chapterId);
      if (chapter) {
        setFormData({
          title: chapter.title,
          content: chapter.content
        });
      }
    };

    fetchChapter();
  }, [courseId, chapterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = chapterId
        ? await updateChapter(courseId, chapterId, formData)
        : await createChapter(courseId, formData);

      if (!result.success) {
        setError(result.error || <FormattedMessage id="admin.chapters.form.error" />);
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
        label={<FormattedMessage id="admin.chapters.form.title" />}
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          <FormattedMessage id="admin.chapters.form.content" />
        </label>
        <MarkdownEditor
          value={formData.content}
          onChange={(value) => setFormData({ ...formData, content: value })}
          placeholder={<FormattedMessage id="admin.chapters.form.placeholder" />}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end space-x-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <FormattedMessage id="admin.chapters.form.saving" />
          ) : chapterId ? (
            <FormattedMessage id="admin.chapters.form.save" />
          ) : (
            <FormattedMessage id="admin.chapters.form.create" />
          )}
        </Button>
      </div>
    </form>
  );
};
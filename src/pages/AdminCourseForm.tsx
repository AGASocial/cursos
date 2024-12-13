import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Shield, Upload, ArrowLeft, Plus, Pencil, Trash2, BookOpen, LayoutDashboard, GripVertical } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, createCourse, updateCourse } from '../lib/admin';
import { getCourseById } from '../lib/courses';
import { getCourseChapters, reorderChapters, type Chapter } from '../lib/chapters';

const categories = ['programming', 'design', 'business', 'marketing'] as const;
const levels = ['beginner', 'intermediate', 'advanced'] as const;

type TabType = 'info' | 'chapters';

export const AdminCourseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { state } = useLocation();
  const isEditMode = Boolean(courseId);

  const [activeTab, setActiveTab] = useState<TabType>(state?.activeTab || 'info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
  const [reordering, setReordering] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    duration: '',
    price: '',
    category: 'programming' as typeof categories[number],
    level: 'beginner' as typeof levels[number],
    description: '',
    aboutCourse: '',
    learningObjectives: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      const [course, courseChapters] = await Promise.all([
        getCourseById(courseId),
        getCourseChapters(courseId)
      ]);
      
      if (course) {
        setFormData({
          title: course.title,
          instructor: course.instructor,
          duration: course.duration,
          price: course.price.toString(),
          category: course.category,
          level: course.level,
          description: course.description,
          aboutCourse: course.aboutCourse,
          learningObjectives: course.learningObjectives,
        });
        setCurrentThumbnail(course.thumbnail);
        setChapters(courseChapters);
      }
    };

    if (isEditMode) {
      fetchData();
    }
  }, [courseId, isEditMode]);

  // Redirect if not admin
  if (!user || !isAdmin(user.email!)) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditMode && !thumbnail) {
      setError('Please select a thumbnail image');
      return;
    }

    setLoading(true);

    const courseData = {
      ...formData,
      price: Number(formData.price),
    };

    const { success, error } = isEditMode
      ? await updateCourse(courseId, courseData, thumbnail)
      : await createCourse(courseData, thumbnail!);

    if (!success) {
      setError(error || `Failed to ${isEditMode ? 'update' : 'create'} course`);
      setLoading(false);
      return;
    }

    navigate('/admin');
  };

  const handleReorder = async (draggedId: string, targetId: string) => {
    const oldIndex = chapters.findIndex(chapter => chapter.id === draggedId);
    const newIndex = chapters.findIndex(chapter => chapter.id === targetId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newChapters = [...chapters];
    const [removed] = newChapters.splice(oldIndex, 1);
    newChapters.splice(newIndex, 0, removed);
    
    setChapters(newChapters);
    
    const { success, error: reorderError } = await reorderChapters(
      courseId!,
      newChapters.map(chapter => chapter.id)
    );

    if (!success) {
      setError(reorderError || 'Failed to reorder chapters');
      // Revert changes on error
      const refreshedChapters = await getCourseChapters(courseId!);
      setChapters(refreshedChapters);
    }
  };

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    e.dataTransfer.setData('text/plain', chapterId);
    setReordering(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId !== targetId) {
      handleReorder(draggedId, targetId);
    }
    setReordering(false);
  };

  const handleDragEnd = () => {
    setReordering(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin')}
          className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
          <FormattedMessage id="admin.chapters.back" />
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-105">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            <FormattedMessage 
              id={isEditMode ? 'admin.courses.edit.title' : 'admin.courses.create.title'} 
            />
          </h1>
          <p className="mt-2 text-base text-gray-600">
            <FormattedMessage 
              id={isEditMode ? 'admin.courses.edit.subtitle' : 'admin.courses.create.subtitle'} 
            />
          </p>
        </div>

        {isEditMode && (
          <div className="mb-6 flex space-x-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('info')}
              className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'info'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span><FormattedMessage id="admin.courses.tabs.info" /></span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'chapters'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5 transform scale-[1.02]'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <LayoutDashboard className="h-4 w-4" />
                <span><FormattedMessage id="admin.courses.tabs.chapters" /></span>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Course Information Form */}
          {(!isEditMode || activeTab === 'info') && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label={<FormattedMessage id="admin.courses.form.title" />}
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="admin.courses.form.instructor" />}
                  required
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="admin.courses.form.duration" />}
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="admin.courses.form.price" />}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.category" />
                  </label>
                  <select
                    className="h-12 block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        <FormattedMessage id={`admin.courses.form.category.${category}`} />
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.level" />
                  </label>
                  <select
                    className="h-12 block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as typeof levels[number] })}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        <FormattedMessage id={`admin.courses.form.level.${level}`} />
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.description" />
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.about" />
                  </label>
                  <MarkdownEditor
                    value={formData.aboutCourse}
                    onChange={(value) => setFormData({ ...formData, aboutCourse: value })}
                    placeholder="# About this course&#10;&#10;Describe the course in detail using Markdown..."
                    minHeight="300px"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.objectives" />
                  </label>
                  <MarkdownEditor
                    value={formData.learningObjectives}
                    onChange={(value) => setFormData({ ...formData, learningObjectives: value })}
                    placeholder="# Learning Objectives&#10;&#10;- First objective&#10;- Second objective&#10;..."
                    minHeight="300px"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="admin.courses.form.thumbnail" />
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <label className="group relative cursor-pointer">
                      <div className="flex h-40 w-56 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-indigo-500 transition-colors duration-200">
                        {thumbnail ? ( 
                          <img
                            src={URL.createObjectURL(thumbnail)}
                            alt="Thumbnail preview"
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : isEditMode && currentThumbnail ? (
                          <img
                            src={currentThumbnail}
                            alt="Current thumbnail"
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
                            <span className="mt-2 block text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors duration-200">
                              <FormattedMessage id="admin.courses.form.thumbnail.upload" />
                            </span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setThumbnail(file);
                        }}
                      />
                    </label>
                    {thumbnail && (
                      <button
                        type="button"
                        onClick={() => setThumbnail(null)}
                        className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                      >
                        <FormattedMessage id="admin.courses.form.thumbnail.remove" />
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                        <span>
                          <FormattedMessage 
                            id={isEditMode ? 'admin.courses.form.saving' : 'admin.courses.form.creating'} 
                          />
                        </span>
                      </div>
                    ) : (
                      <span>
                        <FormattedMessage 
                          id={isEditMode ? 'admin.courses.form.save' : 'admin.courses.form.create'} 
                        />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Chapters Section */}
          {isEditMode && activeTab === 'chapters' && (
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  <FormattedMessage id="admin.courses.chapters.title" />
                </h2>
                <Link to={`/admin/courses/${courseId}/chapters`}>
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span><FormattedMessage id="admin.chapters.new" /></span>
                  </Button>
                </Link>
              </div>

              {chapters.length > 0 ? (
                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chapter.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, chapter.id)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`cursor-grab active:cursor-grabbing ${
                            reordering ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                      </div>
                      <div className="flex space-x-3">
                        <Link to={`/admin/courses/${courseId}/chapters/${chapter.id}`}>
                          <Button variant="outline" className="flex items-center space-x-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300">
                            <Pencil className="h-4 w-4" />
                            <span><FormattedMessage id="admin.courses.edit" /></span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span><FormattedMessage id="admin.courses.delete" /></span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-base font-semibold text-gray-900">
                    <FormattedMessage id="admin.courses.chapters.empty" />
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    <FormattedMessage id="admin.courses.chapters.empty.message" />
                  </p>
                  <Link to={`/admin/courses/${courseId}/chapters`}>
                    <Button className="mt-6 flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span><FormattedMessage id="admin.courses.chapters.first" /></span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Upload, ArrowLeft, Plus, Pencil, Trash2, BookOpen, LayoutList } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, createCourse, updateCourse } from '../lib/admin';
import { getCourseById } from '../lib/courses';
import { getCourseChapters, type Chapter } from '../lib/chapters';
import { ChapterForm } from '../components/admin/ChapterForm';

const categories = ['Programming', 'Design', 'Business', 'Marketing'];
const levels = ['beginner', 'intermediate', 'advanced'] as const;

type TabType = 'info' | 'chapters';

export const AdminCourseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = Boolean(courseId);

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    duration: '',
    price: '',
    category: 'Programming',
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

  const handleChapterSuccess = () => {
    if (courseId) {
      getCourseChapters(courseId).then(setChapters);
    }
    setShowChapterModal(false);
    setEditingChapter(null);
  };

  const handleAddChapter = () => {
    setEditingChapter(null);
    setShowChapterModal(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setShowChapterModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin')}
          className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
          Back to courses
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-105">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Course' : 'Create Course'}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {isEditMode
              ? 'Update your course information'
              : 'Create a new course for your students'}
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
                <span>Course Information</span>
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
                <LayoutList className="h-4 w-4" />
                <span>Chapters</span>
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
                  label="Course Title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label="Instructor"
                  required
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label="Duration (e.g., '2 hours')"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label="Price"
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
                    Category
                  </label>
                  <select
                    className="h-12 block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Level
                  </label>
                  <select
                    className="h-12 block w-full rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as typeof levels[number] })}
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Short Description
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
                    About This Course (Markdown)
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 font-mono text-sm"
                    rows={6}
                    required
                    value={formData.aboutCourse}
                    onChange={(e) => setFormData({ ...formData, aboutCourse: e.target.value })}
                    placeholder="# About this course&#10;&#10;Describe the course in detail using Markdown..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    What You'll Learn (Markdown)
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-200 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 font-mono text-sm"
                    rows={6}
                    required
                    value={formData.learningObjectives}
                    onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                    placeholder="# Learning Objectives&#10;&#10;- First objective&#10;- Second objective&#10;..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Course Thumbnail
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
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
                            <span className="mt-2 block text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors duration-200">
                              Upload thumbnail
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
                        Remove
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
                        <span>{isEditMode ? 'Saving...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <span>{isEditMode ? 'Save Changes' : 'Create Course'}</span>
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
                <h2 className="text-xl font-semibold text-gray-900">Course Chapters</h2>
                <Button
                  onClick={handleAddChapter}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Chapter</span>
                </Button>
              </div>

              {chapters.length > 0 ? (
                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                        <p className="text-sm text-gray-500">Order: {chapter.order}</p>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-all duration-200"
                          onClick={() => handleEditChapter(chapter)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500 hover:text-red-700 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <LayoutList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-base font-semibold text-gray-900">No chapters yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Get started by creating a new chapter.
                  </p>
                  <Button
                    onClick={handleAddChapter}
                    className="mt-6 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Chapter</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chapter Modal */}
        <Modal
          isOpen={showChapterModal}
          onClose={() => {
            setShowChapterModal(false);
            setEditingChapter(null);
          }}
          title={editingChapter ? 'Edit Chapter' : 'New Chapter'}
        >
          <ChapterForm
            courseId={courseId!}
            onSuccess={handleChapterSuccess}
            initialData={editingChapter || undefined}
          />
        </Modal>
      </div>
    </div>
  );
};
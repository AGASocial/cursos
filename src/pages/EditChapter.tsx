import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { ChapterForm } from '../components/admin/ChapterForm';
import { getCourseById } from '../lib/courses';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../lib/admin';

export const EditChapter = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      const course = await getCourseById(courseId);
      if (course) {
        setCourseName(course.title);
      }
      setLoading(false);
    };

    fetchCourse();
  }, [courseId]);

  // Redirect if not admin
  if (!user || !isAdmin(user.email!)) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    // Navigate back to the course page with chapters tab active
    navigate(`/admin/courses/${courseId}/edit`, { state: { activeTab: 'chapters' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/admin/courses/${courseId}/edit`, { state: { activeTab: 'chapters' } })}
          className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
          <FormattedMessage id="admin.chapters.back" />
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-105">
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            <FormattedMessage 
              id={chapterId ? 'admin.chapters.edit' : 'admin.chapters.new'} 
            />
          </h1>
          <p className="mt-2 text-base text-gray-600">{courseName}</p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
          <div className="lg:col-span-12">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
              <ChapterForm
                courseId={courseId!}
                chapterId={chapterId}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
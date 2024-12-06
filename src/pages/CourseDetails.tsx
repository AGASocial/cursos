import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, BookOpen, BarChart, ArrowLeft, ShoppingCart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../components/ui/Button';
import { getCourseById, type Course } from '../lib/courses';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const { state: cart, addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      setLoading(false);
    };

    fetchCourse();
  }, [courseId]);

  const isInCart = course && cart.items.some(item => item.id === course.id);

  const handleEnroll = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (course) {
      addItem(course);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <p className="mt-2 text-gray-600">The course you're looking for doesn't exist.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/courses')}
          >
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/courses')}
            className="mb-8 inline-flex items-center text-sm text-white/90 hover:text-white transition-colors duration-200 hover:translate-x-[-4px] transform"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to courses
          </button>
          <div className="lg:flex lg:items-center lg:space-x-12">
            <div className="lg:w-1/2">
              <h1 className="text-4xl font-bold text-white sm:text-5xl leading-tight">
                {course.title}
              </h1>
              <p className="mt-6 text-lg text-white/90 leading-relaxed">{course.description}</p>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                  <Users className="mr-2 h-5 w-5" />
                  <span>{course.enrolledCount} students</span>
                </div>
                <div className="flex items-center backdrop-blur-sm bg-white/10 rounded-full px-4 py-2">
                  <BarChart className="mr-2 h-5 w-5" />
                  <span className="capitalize">{course.level}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 lg:w-1/2">
              <div className="overflow-hidden rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4">About this course</h2>
              <div className="prose prose-lg mt-6 max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {course.aboutCourse}
                </ReactMarkdown>
              </div>

              <div className="mt-12">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">What you'll learn</h3>
                <div className="prose prose-lg mt-6 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {course.learningObjectives}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-24">
              <div className="rounded-2xl bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${course.price}</span>
                </div>
                <Button
                  className={`w-full text-lg py-6 transition-transform duration-200 ${
                    !isInCart && 'hover:transform hover:scale-[1.02]'
                  }`}
                  onClick={handleEnroll}
                  disabled={isInCart || !user}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isInCart ? 'Added to Cart' : 'Enroll Now'}
                </Button>
                <div className="mt-8 space-y-5 text-sm text-gray-600">
                  <div className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <Clock className="mr-3 h-5 w-5 text-blue-600" />
                    <span>{course.duration} of content</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <Users className="mr-3 h-5 w-5 text-blue-600" />
                    <span>{course.enrolledCount} students enrolled</span>
                  </div>
                  <div className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <BarChart className="mr-3 h-5 w-5 text-blue-600" />
                    <span className="capitalize">{course.level} level</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
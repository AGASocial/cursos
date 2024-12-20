import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, BookOpen, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents, processYouTubeEmbeds } from '../lib/markdown';
import { getCourseById, getCourseBySlug, type Course } from '../lib/courses';
import { getCourseChapters, type Chapter } from '../lib/chapters';
import { useAuth } from '../contexts/AuthContext';
import { getUserData } from '../lib/users';
import { Navbar } from '../components/layout/Navbar';

export const ViewCourse = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseSlug || !user) {
        navigate('/courses');
        return;
      }

      try {
        // First get the course by slug to get its ID
        const courseData = await getCourseBySlug(courseSlug);
        if (!courseData) {
          console.error('Course not found:', courseSlug);
          navigate('/courses');
          return;
        }

        // Check if user has access to this course
        const userData = await getUserData(user.uid);
        if (!userData?.enrolledCourses?.includes(courseData.id)) {
          console.error('User not enrolled in course:', courseData.id);
          navigate(`/courses/${courseSlug}`);
          return;
        }

        // Fetch chapters using the course ID
        const chaptersData = await getCourseChapters(courseData.id);

        setCourse(courseData);
        setChapters(chaptersData);
        setSelectedChapter(chaptersData[0] || null);
      } catch (error) {
        console.error('Error fetching course data:', error);
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseSlug, user, navigate]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading course content...</div>
      </div>
    );
  }

  if (!course || !selectedChapter) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <p className="mt-2 text-gray-600">The course you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              components={markdownComponents}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapter(chapter)}
                className={`flex w-full items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                  selectedChapter?.id === chapter.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-sm">{index + 1}.</span>
                <span className="flex-1 text-left">{chapter.title}</span>
                {selectedChapter?.id === chapter.id ? (
                  <ChevronDown className="ml-3 h-5 w-5" />
                ) : (
                  <ChevronRight className="ml-3 h-5 w-5" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="border-r border-gray-200 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900">{selectedChapter.title}</h1>
          </div>
        </div>

        {/* Course content */}
        <div className="mx-auto w-full px-4 py-8">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">{selectedChapter.title}</h1>
          </div>
          <div className="prose prose-lg prose-blue max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-gray-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-blue-600 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-gray-50 prose-pre:p-6 prose-pre:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-ul:list-disc prose-ol:list-decimal">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {selectedChapter.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};
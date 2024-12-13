import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { CourseCard } from '../components/course/CourseCard';
import { getCourses, type Course } from '../lib/courses';
import { getUserData } from '../lib/users';
import { useAuth } from '../contexts/AuthContext';

const categories = ['all', 'programming', 'design', 'business', 'marketing'] as const;
const levels = ['all', 'beginner', 'intermediate', 'advanced'] as const;

export const Courses = () => {
  const intl = useIntl();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedCourses, userData] = await Promise.all([
        getCourses(),
        user ? getUserData(user.uid) : null,
      ]);
      
      setCourses(fetchedCourses);
      setEnrolledCourses(userData?.enrolledCourses || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4 transform transition-transform hover:scale-110">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            <FormattedMessage id="courses.title" />
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            <FormattedMessage id="courses.subtitle" />
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 space-y-6 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={intl.formatMessage({ id: 'courses.search.placeholder' })}
              className="pl-12 h-12 text-lg rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-8">
            <div className="space-y-3 flex-1">
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <FormattedMessage id="courses.filter.category" />
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    <FormattedMessage id={category === 'all' ? 'courses.filter.all' : `admin.courses.form.category.${category}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                <FormattedMessage id="courses.filter.level" />
              </label>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLevel === level
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    <FormattedMessage id={level === 'all' ? 'courses.filter.all' : `admin.courses.form.level.${level}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-lg text-gray-600"><FormattedMessage id="courses.loading" /></p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                isEnrolled={enrolledCourses.includes(course.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-lg text-gray-600"><FormattedMessage id="courses.empty" /></p>
            <p className="mt-2 text-gray-500"><FormattedMessage id="courses.empty.suggestion" /></p>
          </div>
        )}
      </div>
    </div>
  );
};
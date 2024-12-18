import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Clock, Users, BarChart, ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../ui/Button';
import { getCourses, getEnrolledUsers, type Course } from '../../lib/courses';

export const AdminCoursesList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const fetchCourses = async () => {
      const fetchedCourses = await getCourses();
      setCourses(fetchedCourses);
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const handleToggleUsers = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }

    setExpandedCourse(courseId);
    if (!enrolledUsers[courseId]) {
      const users = await getEnrolledUsers(courseId);
      setEnrolledUsers(prev => ({ ...prev, [courseId]: users }));
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">
          <FormattedMessage id="courses.loading" />
        </p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            <FormattedMessage id="courses.empty" />
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            <FormattedMessage id="courses.empty.suggestion" />
          </p>
          <div className="mt-6">
            <Link to="/admin/courses/new">
              <Button>
                <FormattedMessage id="admin.courses.new" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.courses.tab" />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="course.details" />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="course.price" />
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.actions" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {courses.map((course) => (
            <React.Fragment key={course.id}>
              <tr>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-20 w-32 flex-shrink-0">
                      <Link to={`/courses/${course.id}`}>
                        <img
                          className="h-full w-full rounded object-cover transition-transform hover:scale-105"
                          src={course.thumbnail}
                          alt={course.title}
                        />
                      </Link>
                    </div>
                    <div className="ml-4">
                      <Link 
                        to={`/courses/${course.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200"
                      >
                        {course.title}
                      </Link>
                      <div className="text-sm text-gray-500">{course.instructor}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      {course.duration}
                    </div>
                    <button
                      onClick={() => handleToggleUsers(course.id)}
                      className="flex items-center hover:text-blue-600"
                    >
                      <Users className="mr-1 h-4 w-4" />
                      {course.enrolledCount}
                      {expandedCourse === course.id ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </button>
                    <div className="flex items-center">
                      <BarChart className="mr-1 h-4 w-4" />
                      <span><FormattedMessage id={`admin.courses.form.level.${course.level}`} /></span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">${course.price}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link to={`/admin/courses/${course.id}/edit`}>
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
                </td>
              </tr>
              {expandedCourse === course.id && (
                <tr>
                  <td colSpan={4} className="bg-gray-50 px-6 py-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        <FormattedMessage id="admin.courses.enrolledUsers" />
                      </h4>
                      {enrolledUsers[course.id]?.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1">
                          {enrolledUsers[course.id].map((email, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              {email}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          <FormattedMessage id="admin.courses.noEnrolledUsers" />
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Clock, Users, BarChart, ChevronDown, ChevronUp, FileDown, Plus, Upload, Eye } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Button } from '../ui/Button';
import { getAllCourses, getEnrolledUsers, updateCourseStatus, type Course, getCourses } from '../../lib/courses';
import { Switch } from '../ui/Switch';
import { Tooltip } from '../ui/Tooltip';
import { deleteCourse } from '../../lib/courseManagement';
import { exportCourse, importCourse } from '../../lib/courseImportExport';
import { backupCourse, restoreCourse } from '../../lib/courseBackupRestore';

export const AdminCoursesList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const backupInputRef = React.useRef<HTMLInputElement>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<{ [key: string]: string[] }>({});
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const refreshCourses = async () => {
    const fetchedCourses = await getAllCourses();
    setCourses(fetchedCourses);
  };

  useEffect(() => {
    const fetchInitialCourses = async () => {
      const fetchedCourses = await getAllCourses();
      setCourses(fetchedCourses);
      setLoading(false);
    };
    fetchInitialCourses();
  }, []);

  const handleStatusChange = async (courseId: string, newStatus: 'draft' | 'published') => {
    const success = await updateCourseStatus(courseId, newStatus);
    if (success) {
      setCourses(courses.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus }
          : course
      ));
    }
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    
    setDeleteLoading(true);
    const { success } = await deleteCourse(courseToDelete.id);
    
    if (success) {
      await refreshCourses();
    }
    
    setDeleteLoading(false);
    setCourseToDelete(null);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);

    try {
      const { success, error, courses: updatedCourses } = await importCourse(file);
      if (success) {
        const latestCourses = await getAllCourses();
        setCourses(latestCourses);
      } else {
        console.error('Failed to import course:', error);
      }
    } catch (err) {
      console.error('Error during import:', err);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBackupClick = async (course: Course) => {
    try {
      await backupCourse(course.id, course);
    } catch (error) {
      console.error('Error backing up course:', error);
    }
  };

  const handleRestoreClick = () => {
    backupInputRef.current?.click();
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreLoading(true);
    try {
      const { success, error } = await restoreCourse(file);
      if (success) {
        const updatedCourses = await getAllCourses();
        setCourses(updatedCourses);
      } else {
        console.error('Failed to restore course:', error);
      }
    } catch (err) {
      console.error('Error during restore:', err);
    } finally {
      setRestoreLoading(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={backupInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleRestoreFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            <FormattedMessage id="courses.empty" />
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            <FormattedMessage id="courses.empty.suggestion" />
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={handleRestoreClick}
              disabled={restoreLoading}
              className="flex items-center space-x-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
            >
              <Upload className="h-4 w-4" />
              <span>
                {restoreLoading ? (
                  <FormattedMessage id="admin.orders.processing" />
                ) : (
                  <FormattedMessage id="admin.courses.restore" />
                )}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={handleImportClick}
              disabled={importLoading}
              className="flex items-center space-x-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
            >
              <Upload className="h-4 w-4" />
              <span>
                {importLoading ? (
                  <FormattedMessage id="admin.orders.processing" />
                ) : (
                  <FormattedMessage id="admin.courses.import" />
                )}
              </span>
            </Button>
            <Link to="/admin/courses/new">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <FormattedMessage id="admin.courses.new" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header Actions */}
      <div className="flex justify-end space-x-2 p-4 border-b border-gray-200">
        <Button
          variant="outline"
          onClick={handleRestoreClick}
          disabled={restoreLoading}
          className="flex items-center space-x-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
        >
          <Upload className="h-4 w-4" />
          <span>
            {restoreLoading ? (
              <FormattedMessage id="admin.orders.processing" />
            ) : (
              <FormattedMessage id="admin.courses.restore" />
            )}
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={handleImportClick}
          disabled={importLoading}
          className={`flex items-center space-x-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 min-w-[140px] ${
            importLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>
            {importLoading ? (
              <FormattedMessage id="admin.orders.processing" />
            ) : (
              <FormattedMessage id="admin.courses.import" />
            )}
          </span>
        </Button>
        <Link to="/admin/courses/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span><FormattedMessage id="admin.courses.new" /></span>
          </Button>
        </Link>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={backupInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleRestoreFileChange}
      />
      {/* Table Container */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <FormattedMessage id="admin.courses.tab" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <FormattedMessage id="course.details" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <FormattedMessage id="course.price" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
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
                        <Link to={`/admin/courses/${course.id}/edit`}>
                          <img
                            className="h-full w-full rounded-lg object-cover transition-transform hover:scale-105" 
                            src={course.thumbnail}
                            alt={course.title}
                          />
                        </Link>
                      </div>
                      <div className="ml-4 min-w-0 max-w-[300px]">
                        <Link 
                          to={`/admin/courses/${course.id}/edit`}
                          className="block text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200"
                        >
                          <div className="break-words">{course.title}</div>
                        </Link>
                        <div className="text-sm text-gray-500">{course.instructor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap w-48">
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center">
                        <BarChart className="mr-1 h-4 w-4" />
                        <span><FormattedMessage id={`admin.courses.form.level.${course.level}`} /></span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap w-24">
                    <div className="text-sm font-medium text-gray-900">${course.price}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium w-[280px]">
                    <div className="flex justify-end space-x-2">
                      <div className="flex flex-col items-center mr-2">
                        <span className={`text-xs mb-1 ${
                          course.status === 'published' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <FormattedMessage 
                            id={course.status === 'published' ? 'admin.courses.status.published' : 'admin.courses.status.draft'}
                          />
                        </span>
                        <Switch
                          className="flex-shrink-0"
                          checked={course.status === 'published'}
                          onCheckedChange={(checked) =>
                            handleStatusChange(course.id, checked ? 'published' : 'draft')
                          }
                        />
                      </div>
                      <div className="flex justify-end space-x-1">
                        <Link 
                          to={`/admin/courses/${course.id}/participants`}
                          className="inline-block"
                        >
                          <Tooltip content={<FormattedMessage id="admin.courses.tooltip.participants" />}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-300"
                            >
                              <div className="flex items-center space-x-1">
                                <span>{course.enrolledCount}</span>
                                <Users className="h-4 w-4" />
                              </div>
                            </Button>
                          </Tooltip>
                        </Link>
                        <Link 
                          to={`/courses/${course.id}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Tooltip content={<FormattedMessage id="admin.courses.tooltip.preview" />}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </Link>
                        <Link 
                          to={`/admin/courses/${course.id}/edit`}
                          className="inline-block"
                        >
                          <Tooltip content={<FormattedMessage id="admin.courses.tooltip.edit" />}>
                            <Button variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </Link>
                        <Tooltip content={<FormattedMessage id="admin.courses.tooltip.backup" />}>
                          <Button
                            variant="outline"
                            onClick={() => handleBackupClick(course)}
                            className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content={<FormattedMessage id="admin.courses.tooltip.export" />}>
                          <Button
                            variant="outline"
                            onClick={() => exportCourse(course)}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content={<FormattedMessage id="admin.courses.tooltip.delete" />}>
                          <Button
                            onClick={() => handleDeleteClick(course)}
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
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
      <ConfirmationModal
        isOpen={courseToDelete !== null}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={<FormattedMessage id="admin.courses.delete.title" />}
        message={<FormattedMessage 
          id="admin.courses.delete.message" 
          values={{ title: courseToDelete?.title }}
        />}
        confirmText={<FormattedMessage id="admin.courses.delete" />}
        cancelText={<FormattedMessage id="admin.courses.delete.cancel" />}
        loading={deleteLoading}
      />
    </div>
  );
};
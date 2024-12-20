import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Users, ArrowLeft, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { getCourseById } from '../lib/courses';
import { getEnrolledUsers, addParticipant, removeParticipant, exportParticipants } from '../lib/participants';
import { useAuth } from '../contexts/AuthContext';

interface Participant {
  id: string;
  email: string;
  name: string;
}

export const CourseParticipants = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [courseName, setCourseName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;

      try {
        const [course, enrolledUsers] = await Promise.all([
          getCourseById(courseId),
          getEnrolledUsers(courseId)
        ]);

        if (course) {
          setCourseName(course.title);
          setParticipants(enrolledUsers);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error loading participants');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // Redirect if not admin
  if (!user || !isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    setError('');
    setSuccess('');

    try {
      const { success, error } = await addParticipant(courseId, newParticipantEmail);
      
      if (success) {
        const updatedParticipants = await getEnrolledUsers(courseId);
        setParticipants(updatedParticipants);
        setNewParticipantEmail('');
        setSuccess('Participant added successfully');
      } else {
        setError(error || 'Failed to add participant');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleDeleteClick = (participant: Participant) => {
    setParticipantToDelete(participant);
  };

  const handleConfirmDelete = async () => {
    if (!participantToDelete || !courseId) return;
    
    setDeleteLoading(true);
    try {
      const { success, error } = await removeParticipant(courseId, participantToDelete.id);
      
      if (success) {
        const updatedParticipants = await getEnrolledUsers(courseId);
        setParticipants(updatedParticipants);
      } else {
        setError(error || 'Failed to remove participant');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setDeleteLoading(false);
      setParticipantToDelete(null);
    }
  };

  const handleExport = () => {
    if (!courseId || !courseName) return;
    exportParticipants(participants, courseName);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin')}
          className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
          <FormattedMessage id="participants.back" />
        </button>

        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            <FormattedMessage id="participants.title" />
          </h1>
          <p className="mt-2 text-base text-gray-600">{courseName}</p>
        </div>

        <div className="space-y-6">
          {/* Add Participant Form */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <form onSubmit={handleAddParticipant} className="flex items-end space-x-4">
              <div className="flex-1">
                <Input
                  label={<FormattedMessage id="participants.add.email" />}
                  type="email"
                  value={newParticipantEmail}
                  onChange={(e) => setNewParticipantEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <Button type="submit" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span><FormattedMessage id="participants.add.button" /></span>
              </Button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
          </div>

          {/* Participants List */}
          <div className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                <FormattedMessage id="participants.list.title" />
              </h2>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span><FormattedMessage id="participants.export" /></span>
              </Button>
            </div>
            <div className="divide-y divide-gray-200">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                  >
                    <div>
                      {participant.name && (
                        <div className="font-medium text-gray-900">{participant.name}</div>
                      )}
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteClick(participant)}
                      className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span><FormattedMessage id="participants.remove.confirm" /></span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <FormattedMessage id="participants.list.empty" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={participantToDelete !== null}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={<FormattedMessage id="participants.remove.title" />}
        message={<FormattedMessage 
          id="participants.remove.message" 
          values={{ email: participantToDelete?.email }}
        />}
        confirmText={<FormattedMessage id="participants.remove.confirm" />}
        cancelText={<FormattedMessage id="participants.remove.cancel" />}
        loading={deleteLoading}
      />
    </div>
  );
};
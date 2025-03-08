import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { enrollUserInCourses, getCourseDetailsByIds, CourseDetails } from '../../lib/users';
import { updateOrderStatus } from '../../lib/orders';

export const Return = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [enrolledCourses, setEnrolledCourses] = useState<CourseDetails[]>([]);
  const [orderUpdated, setOrderUpdated] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');

    if (!sessionId) {
      setStatus('error');
      setError('No session ID found in the URL');
      setLoading(false);
      return;
    }

    // If success parameter is false, don't check status
    if (success === 'false' || success === 'canceled') {
      setStatus('canceled');
      setLoading(false);
      return;
    }

    console.log(`Checking session status for: ${sessionId}`);
    
    fetch(`${import.meta.env.VITE_API_URL}/Payments/session-status?session_id=${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch session status: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Session status data:', data);
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
        
        // If payment is complete and we have a user, update order and enroll in courses
        if (data.status === 'complete' && user) {
          // Get order ID from session metadata
          const orderId = data.metadata?.orderId;
          
          // Get course IDs from session metadata
          let courseIds = data.metadata?.courseIds;
          
          // If no course IDs in metadata, try to get from localStorage as fallback
          if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
            console.log('No valid course IDs in session metadata, trying localStorage');
            const courseIdsString = localStorage.getItem('purchasedCourseIds');
            if (courseIdsString) {
              try {
                courseIds = JSON.parse(courseIdsString);
              } catch (error) {
                console.error('Error parsing course IDs from localStorage:', error);
                setEnrollmentStatus('error');
                setError('Failed to parse course IDs from localStorage');
                return;
              }
            }
          }
          
          // If no order ID in metadata, try to get from localStorage as fallback
          let orderIdToUse = orderId;
          if (!orderIdToUse) {
            console.log('No order ID in session metadata, trying localStorage');
            const storedOrderId = localStorage.getItem('pendingOrderId');
            if (storedOrderId) {
              orderIdToUse = storedOrderId;
            } else {
              console.warn('No order ID found in metadata or localStorage');
            }
          }
          
          if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
            console.log('Course IDs for enrollment:', courseIds);
            
            // Get course details for display
            getCourseDetailsByIds(courseIds)
              .then(courses => {
                setEnrolledCourses(courses);
                
                // Update order status if we have an order ID
                if (orderIdToUse && !orderUpdated) {
                  console.log('Updating order status for order:', orderIdToUse);
                  
                  // Update the order status to completed
                  updateOrderStatus(orderIdToUse, 'completed')
                    .then(result => {
                      if (result.success) {
                        console.log('Order status updated successfully');
                        setOrderUpdated(true);
                        
                        // Now enroll the user in the courses
                        return enrollUserInCourses(user.uid, courseIds);
                      } else {
                        throw new Error(result.error || 'Failed to update order status');
                      }
                    })
                    .then(enrollResult => {
                      console.log('Enrollment result:', enrollResult);
                      if (enrollResult.success) {
                        setEnrollmentStatus('success');
                        // Clear the stored IDs from localStorage
                        localStorage.removeItem('purchasedCourseIds');
                        localStorage.removeItem('pendingOrderId');
                      } else {
                        setEnrollmentStatus('error');
                        setError(`Enrollment error: ${enrollResult.error}`);
                      }
                    })
                    .catch(error => {
                      console.error('Error in order/enrollment process:', error);
                      setEnrollmentStatus('error');
                      setError(error instanceof Error ? error.message : 'Failed to process order');
                    });
                } else if (!orderIdToUse) {
                  // If we don't have an order ID, just enroll the user in the courses
                  console.warn('No order ID found, proceeding with enrollment only');
                  enrollUserInCourses(user.uid, courseIds)
                    .then(enrollResult => {
                      console.log('Enrollment result:', enrollResult);
                      if (enrollResult.success) {
                        setEnrollmentStatus('success');
                        // Clear the stored course IDs from localStorage
                        localStorage.removeItem('purchasedCourseIds');
                      } else {
                        setEnrollmentStatus('error');
                        setError(`Enrollment error: ${enrollResult.error}`);
                      }
                    })
                    .catch(error => {
                      console.error('Error enrolling user in courses:', error);
                      setEnrollmentStatus('error');
                      setError(error instanceof Error ? error.message : 'Failed to enroll in courses');
                    });
                }
              })
              .catch(error => {
                console.error('Error fetching course details:', error);
                setEnrollmentStatus('error');
                setError('Failed to fetch course details');
              });
          } else {
            console.warn('No course IDs found in session metadata');
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching session status:', error);
        setStatus('error');
        setError(error instanceof Error ? error.message : 'An error occurred');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, orderUpdated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-gray-600">
          <FormattedMessage id="payment.return.verifying" />
        </p>
      </div>
    );
  }

  if (status === 'open') {
    return <Navigate to="/checkout" />;
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              <FormattedMessage id="payment.return.success.title" />
            </h1>
            <p className="text-gray-600 mb-4 text-center">
              <FormattedMessage 
                id="payment.return.success.message" 
                values={{ email: customerEmail }}
              />
            </p>
            {enrollmentStatus === 'success' && (
              <div className="mb-6">
                <p className="text-green-600 mb-4 text-center font-semibold">
                  <FormattedMessage id="payment.return.enrollment.success" />
                </p>
                
                {enrolledCourses.length > 0 && (
                  <div className="mt-6 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="text-sm font-medium text-gray-700">
                        <FormattedMessage id="payment.return.courses.title" />
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {enrolledCourses.map(course => (
                        <li key={course.id} className="px-4 py-3 flex items-center">
                          <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                          <span className="text-sm text-gray-700">{course.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {enrollmentStatus === 'error' && (
              <p className="text-yellow-600 mb-4 text-center">
                <FormattedMessage id="payment.return.enrollment.error" />
              </p>
            )}
            <p className="text-gray-600 text-center mb-8">
              <FormattedMessage id="payment.return.support" />{' '}
              <a 
                href="mailto:soporte-cursos@aga.social" 
                className="text-blue-600 hover:text-blue-800"
              >
                soporte-cursos@aga.social
              </a>
            </p>
            <div className="flex justify-center">
              <Link to="/courses">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <FormattedMessage id="payment.return.back" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              <FormattedMessage id="payment.return.canceled.title" />
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              <FormattedMessage id="payment.return.canceled.message" />
            </p>
            <div className="flex justify-center">
              <Link to="/checkout">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <FormattedMessage id="payment.return.back.checkout" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4 text-center">
            <FormattedMessage id="payment.return.error.title" />
          </h1>
          <p className="text-gray-600 mb-4 text-center">
            <FormattedMessage id="payment.return.error.message" />
          </p>
          {error && (
            <p className="text-sm text-red-500 mb-8 text-center">
              <FormattedMessage id="payment.return.error.details" /> {error}
            </p>
          )}
          <div className="flex justify-center">
            <Link to="/checkout">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                <FormattedMessage id="payment.return.back.checkout" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

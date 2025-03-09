import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, BookOpen, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { CourseDetails, enrollUserInCourses } from '../../lib/users';
import { db } from '../../lib/firebase';
import { 
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { setCartItems } from '../../store/features/cartSlice';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import type { Course } from '../../lib/courses';

// Add constants for collections
const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

// Define interfaces for order items
interface OrderItem {
  courseId: string;
  title: string;
  price: number;
}

export const Return = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [enrolledCourses, setEnrolledCourses] = useState<CourseDetails[]>([]);
  const [customerEmail, setCustomerEmail] = useState<string>(''); // Needed for the success message
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const [canceledProcessed, setCanceledProcessed] = useState(false);

  useEffect(() => {
    // Skip processing if we've already handled this canceled payment
    if (canceledProcessed) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    
    // Log localStorage state for debugging
    console.log('localStorage state:', {
      pendingOrderId: localStorage.getItem('pendingOrderId'),
      purchasedCourseIds: localStorage.getItem('purchasedCourseIds'),
      cart: localStorage.getItem('cart')
    });
    
    // If the cart is empty but we have purchasedCourseIds, try to restore the cart
    const cart = localStorage.getItem('cart');
    const parsedCart = cart ? JSON.parse(cart) : { items: [] };
    const purchasedCourseIds = localStorage.getItem('purchasedCourseIds');
    
    if (parsedCart.items.length === 0 && purchasedCourseIds) {
      console.log('Cart is empty but purchasedCourseIds exists, attempting to restore cart');
      try {
        const courseIds = JSON.parse(purchasedCourseIds);
        if (Array.isArray(courseIds) && courseIds.length > 0) {
          // This will be handled in the canceled === 'true' block or below
          console.log('Found course IDs to restore:', courseIds);
        }
      } catch (e) {
        console.error('Error parsing purchasedCourseIds:', e);
      }
    }
    
    if (canceled === 'true') {
      // Set status for canceled payment
      setStatus('canceled');
      
      // Mark as processed to prevent infinite loop
      setCanceledProcessed(true);
      
      // Handle canceled payment scenario
      
      // 1. Get the pending order ID from localStorage
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      
      if (!pendingOrderId) {
        setError('order.not_found');
        setLoading(false);
        return;
      }
      
      // 2. Fetch the pending order to recreate the cart
      const fetchPendingOrder = async () => {
        try {
          console.log('Fetching pending order:', pendingOrderId);
          const orderDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', pendingOrderId));
          
          if (!orderDoc.exists()) {
            console.error('Order not found:', pendingOrderId);
            setError('order.pending_not_found');
            setLoading(false);
            return;
          }
          
          const orderData = orderDoc.data();
          console.log('Order data retrieved successfully:', orderData);
          
          // Skip updating the order status since we don't have permission
          // Only admins can update orders according to the security rules
          // Instead, just focus on restoring the cart
          
          // 4. Recreate the cart with the courses from the pending order
          // Check for items array as seen in the Firestore document
          const orderItems = orderData.items || [];
          console.log('Order items found:', orderItems);
          
          if (orderItems.length > 0) {
            console.log('Restoring cart with items:', orderItems);
            
            // Convert items to CourseDetails format
            const cartItems = await Promise.all(orderItems.map(async (item: OrderItem) => {
              // Fetch additional course details if needed
              try {
                const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', item.courseId));
                if (courseDoc.exists()) {
                  const courseData = courseDoc.data();
                  return {
                    id: item.courseId,
                    title: item.title,
                    price: item.price,
                    description: courseData.description || '',
                    imageUrl: courseData.imageUrl || '',
                    instructor: courseData.instructor || ''
                  } as CourseDetails;
                }
              } catch (err) {
                console.error(`Error fetching details for course ${item.courseId}:`, err);
              }
              
              // Fallback if course fetch fails
              return {
                id: item.courseId,
                title: item.title,
                price: item.price,
                description: '',
                imageUrl: '',
                instructor: ''
              } as CourseDetails;
            }));
            
            console.log('Cart items after conversion:', cartItems);
            
            // Update Redux store
            dispatch(setCartItems(cartItems));
            
            // Also update CartContext
            clearCart();
            cartItems.forEach((item: CourseDetails) => {
              // Create a minimal Course object with required fields
              const courseItem: Course = {
                id: item.id,
                title: item.title || '',
                price: item.price || 0,
                description: item.description || '',
                instructor: item.instructor || '',
                // Add required fields with default values
                status: 'published',
                slug: '',
                thumbnail: '',
                duration: '',
                enrolledCount: 0,
                category: '',
                level: 'beginner',
                aboutCourse: '',
                learningObjectives: '',
                createdAt: new Date(),
                updatedAt: new Date()
              };
              addItem(courseItem);
            });
            
            // Also update localStorage directly to ensure consistency
            const cartState = { 
              items: cartItems, 
              total: cartItems.reduce((sum: number, item: CourseDetails) => sum + (item.price || 0), 0) 
            };
            localStorage.setItem('cart', JSON.stringify(cartState));
            console.log('Cart saved to localStorage:', cartState);
            
            // 5. Inform the user and redirect to cart
            setError('payment.canceled_cart_restored');
            setLoading(false);
            
            
            
          } else {
            // Try to use purchasedCourseIds as a fallback
            const purchasedCourseIds = localStorage.getItem('purchasedCourseIds');
            if (purchasedCourseIds) {
              try {
                const courseIds = JSON.parse(purchasedCourseIds);
                if (Array.isArray(courseIds) && courseIds.length > 0) {
                  // Fetch course details for these IDs
                  const fetchCourseDetails = async () => {
                    // This is a placeholder - you'll need to implement or use an existing function
                    // to fetch course details by IDs
                    const courses = await Promise.all(
                      courseIds.map(async (id) => {
                        const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', id));
                        if (courseDoc.exists()) {
                          const courseData = courseDoc.data();
                          return {
                            id,
                            title: courseData.title || '',
                            price: courseData.price || 0,
                            description: courseData.description || '',
                            imageUrl: courseData.imageUrl || '',
                            instructor: courseData.instructor || ''
                          };
                        }
                        return null;
                      })
                    );
                    
                    const validCourses = courses.filter(course => course !== null);
                    if (validCourses.length > 0) {
                      // Update Redux store
                      dispatch(setCartItems(validCourses));
                      
                      // Update CartContext
                      clearCart();
                      validCourses.forEach((item: CourseDetails) => {
                        // Create a minimal Course object with required fields
                        const courseItem: Course = {
                          id: item.id,
                          title: item.title || '',
                          price: item.price || 0,
                          description: item.description || '',
                          instructor: item.instructor || '',
                          // Add required fields with default values
                          status: 'published',
                          slug: '',
                          thumbnail: '',
                          duration: '',
                          enrolledCount: 0,
                          category: '',
                          level: 'beginner',
                          aboutCourse: '',
                          learningObjectives: '',
                          createdAt: new Date(),
                          updatedAt: new Date()
                        };
                        addItem(courseItem);
                      });
                      
                      // Update localStorage directly
                      const cartState = { 
                        items: validCourses, 
                        total: validCourses.reduce((sum: number, item: CourseDetails) => sum + (item.price || 0), 0) 
                      };
                      localStorage.setItem('cart', JSON.stringify(cartState));
                      console.log('Cart saved to localStorage from purchasedCourseIds:', cartState);
                      
                      setError('payment.canceled_cart_restored');
                    } else {
                      setError('payment.canceled_no_courses');
                    }
                    setLoading(false);
                  };
                  
                  fetchCourseDetails();
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing purchasedCourseIds:', parseError);
              }
            }
            
            setError('payment.canceled_no_courses');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching pending order:', err);
          // Provide more specific error message
          if (err instanceof Error) {
            if (err.message.includes('permission')) {
              setError('payment.permission_error');
              console.error('Permission error accessing order. Make sure your security rules allow reading orders.');
              
              // Try to use purchasedCourseIds as a fallback
              const purchasedCourseIds = localStorage.getItem('purchasedCourseIds');
              if (purchasedCourseIds) {
                console.log('Attempting to restore cart from purchasedCourseIds');
                try {
                  const courseIds = JSON.parse(purchasedCourseIds);
                  if (Array.isArray(courseIds) && courseIds.length > 0) {
                    // Fetch course details for these IDs
                    const fetchCourseDetails = async () => {
                      try {
                        const courses = await Promise.all(
                          courseIds.map(async (id) => {
                            try {
                              const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', id));
                              if (courseDoc.exists()) {
                                const courseData = courseDoc.data();
                                return {
                                  id,
                                  title: courseData.title || '',
                                  price: courseData.price || 0,
                                  description: courseData.description || '',
                                  imageUrl: courseData.imageUrl || '',
                                  instructor: courseData.instructor || ''
                                } as CourseDetails;
                              }
                            } catch (courseErr) {
                              console.error(`Error fetching course ${id}:`, courseErr);
                            }
                            return null;
                          })
                        );
                        
                        const validCourses = courses.filter(course => course !== null) as CourseDetails[];
                        if (validCourses.length > 0) {
                          console.log('Successfully fetched course details from IDs:', validCourses);
                          
                          // Update Redux store
                          dispatch(setCartItems(validCourses));
                          
                          // Update CartContext
                          clearCart();
                          validCourses.forEach((item: CourseDetails) => {
                            // Create a minimal Course object with required fields
                            const courseItem: Course = {
                              id: item.id,
                              title: item.title || '',
                              price: item.price || 0,
                              description: item.description || '',
                              instructor: item.instructor || '',
                              // Add required fields with default values
                              status: 'published',
                              slug: '',
                              thumbnail: '',
                              duration: '',
                              enrolledCount: 0,
                              category: '',
                              level: 'beginner',
                              aboutCourse: '',
                              learningObjectives: '',
                              createdAt: new Date(),
                              updatedAt: new Date()
                            };
                            addItem(courseItem);
                          });
                          
                          // Update localStorage directly
                          const cartState = { 
                            items: validCourses, 
                            total: validCourses.reduce((sum: number, item: CourseDetails) => sum + (item.price || 0), 0) 
                          };
                          localStorage.setItem('cart', JSON.stringify(cartState));
                          console.log('Cart saved to localStorage from purchasedCourseIds:', cartState);
                          
                          setError('payment.canceled_cart_restored');
                          setLoading(false);
                          
                          return;
                        }
                      } catch (detailsErr) {
                        console.error('Error fetching course details:', detailsErr);
                      }
                      
                      // If we get here, we couldn't restore the cart
                      setError('payment.canceled_no_courses');
                      setLoading(false);
                    };
                    
                    fetchCourseDetails();
                    return;
                  }
                } catch (parseErr) {
                  console.error('Error parsing purchasedCourseIds:', parseErr);
                }
              }
            } else {
              setError('payment.cancellation_error');
            }
          } else {
            setError('payment.cancellation_error');
          }
          setLoading(false);
        }
      };
      
      fetchPendingOrder();
      return;
    }
    
    // Handle successful payment scenario (when session_id is present)
    if (!sessionId) {
      setError('payment.no_session_id');
      setLoading(false);
      return;
    }
    
    console.log(`Checking session status for: ${sessionId}`);
    
    verifySession(sessionId);
  }, [dispatch, navigate, user, addItem, clearCart, canceledProcessed]);

  const verifySession = async (sessionId: string) => {
    try {
      // Verify payment with Stripe using the backend endpoint with the correct structure
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log(`Fetching session status from: ${backendUrl}/Payments/session-status?session_id=${sessionId}`);
      
      const response = await fetch(`${backendUrl}/Payments/session-status?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify payment status');
      }
      
      const data = await response.json();
      console.log('Session status data:', data);
      console.log('Session metadata:', data.metadata);
      
      // Set the status from the API response
      setStatus(data.status);
      
      if (data.customer_email) {
        setCustomerEmail(data.customer_email);
      }
      
      if (data.status === 'complete') {
        // Get the order ID associated with this session
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        console.log('Order ID from metadata:', data.metadata?.orderId);
        console.log('Order ID from localStorage:', pendingOrderId);
        
        // If metadata is empty or doesn't have orderId, use the one from localStorage
        const orderId = (data.metadata?.orderId && data.metadata.orderId !== '') 
          ? data.metadata.orderId 
          : pendingOrderId;
          
        console.log('Using Order ID:', orderId);
        
        if (!orderId) {
          setError('Could not find order information.');
          return;
        }
        
        // Update order to 'paid' status
        if (user) {
          await updateDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', orderId), {
            status: 'paid',
            paidAt: serverTimestamp(),
            paymentMethod: 'stripe',
            stripeSessionId: sessionId
          });
          
          // Attempt to enroll user in courses
          try {
            // Get courses from the order
            const orderDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', orderId));
            const orderData = orderDoc.data();
            console.log('Order data:', orderData);
            
            // Try to get course IDs from session metadata first, then fall back to order data
            let courseIds = [];
            
            // Check if metadata has non-empty courseIds array
            if (data.metadata?.courseIds && 
                Array.isArray(data.metadata.courseIds) && 
                data.metadata.courseIds.length > 0) {
              courseIds = data.metadata.courseIds;
              console.log('Using course IDs from session metadata:', courseIds);
            } else {
              // Fall back to order data
              const orderItems = orderData?.items || [];
              courseIds = orderItems.map((item: OrderItem) => item.courseId);
              console.log('Using course IDs from order data:', courseIds);
            }
            
            if (courseIds.length === 0) {
              throw new Error('No course IDs found in session metadata or order data');
            }
            
            // Enroll user in each course
            console.log('Enrolling user in courses:', courseIds);
            await enrollUserInCourses(user.uid, courseIds);
            
            // Fetch course details for display
            console.log('Fetching course details for display');
            const courseDetailsPromises = courseIds.map(async (courseId: string) => {
              const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
              if (courseDoc.exists()) {
                const courseData = courseDoc.data();
                return {
                  id: courseId,
                  title: courseData.title || '',
                  price: courseData.price || 0,
                  description: courseData.description || '',
                  imageUrl: courseData.imageUrl || '',
                  instructor: courseData.instructor || ''
                } as CourseDetails;
              }
              return null;
            });
            
            const courseDetails = (await Promise.all(courseDetailsPromises)).filter(Boolean) as CourseDetails[];
            console.log('Course details:', courseDetails);
            
            // Update order to 'completed' status
            await updateDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', orderId), {
              status: 'completed',
              completedAt: serverTimestamp()
            });
            
            setEnrolledCourses(courseDetails);
            setEnrollmentStatus('success');
            
            // Clear the pending order ID from localStorage
            localStorage.removeItem('pendingOrderId');
            console.log('Cleared pendingOrderId from localStorage');
          } catch (enrollError: unknown) {
            console.error('Error enrolling user in courses:', enrollError);
            setError('Payment successful, but there was an issue enrolling you in some courses. Our team has been notified and will fix this shortly.');
            setEnrollmentStatus('error');
            
            // Log this to a special collection for admin attention
            await addDoc(collection(db, ACADEMIES_COLLECTION, ACADEMY, 'enrollmentErrors'), {
              userId: user.uid,
              orderId: orderId,
              error: enrollError instanceof Error ? enrollError.message : String(enrollError),
              timestamp: serverTimestamp()
            });
          }
        } else {
          setError('User not authenticated. Please log in to complete enrollment.');
        }
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Error verifying session:', err);
      setError('Error verifying payment. Please contact support.');
    } finally {
      // Set loading to false when verification is complete
      setLoading(false);
    }
  };

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
                      {enrolledCourses.map(course => {
                        // Use the slug if available, otherwise generate a slug from the title or use the ID
                        const courseSlug = course.slug || 
                          (course.title ? course.title.toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '') 
                            : course.id);
                        
                        return (
                          <li key={course.id} className="px-4 py-3 flex items-center">
                            <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                            <Link 
                              to={`/courses/${courseSlug}/learn`} 
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {course.title}
                            </Link>
                          </li>
                        );
                      })}
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
              <FormattedMessage id="payment.canceled.title" defaultMessage="Payment Canceled" />
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              <FormattedMessage 
                id="payment.canceled.message" 
                defaultMessage="Your payment was canceled. No charges were made to your account."
              />
            </p>
            {error === 'payment.canceled_cart_restored' && (
              <p className="text-green-600 mb-6 text-center">
                <FormattedMessage 
                  id="payment.canceled_cart_restored" 
                  defaultMessage="We've restored your cart so you can try again when you're ready."
                />
              </p>
            )}
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/checkout')} 
                className="flex items-center"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <FormattedMessage id="payment.go_to_cart" defaultMessage="Go to Cart" />
              </Button>
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <FormattedMessage id={error} defaultMessage="An error occurred" />
            </div>
          )}
          {error && (error === 'payment.canceled_cart_restored' || error === 'payment.canceled_no_courses') && (
            <Button 
              onClick={() => navigate('/checkout')} 
              className="mt-4"
            >
              <FormattedMessage id="payment.go_to_cart" defaultMessage="Go to Cart" />
            </Button>
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

import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, BookOpen, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { CourseDetails, enrollUserInCourses } from '../../lib/users';
import { db } from '../../lib/firebase';
import { incrementEnrolledCount } from '../../lib/courses';
import { 
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
  arrayUnion
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

// Define a simple interface for course objects
interface CourseItem {
  id: string;
  title?: string;
  price?: number;
  description?: string;
  instructor?: string;
  // Add other possible properties as needed
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
    console.log('Enrollment status:', enrollmentStatus);
    console.log('Enrolled courses:', enrolledCourses);
  }, [enrollmentStatus, enrolledCourses]);

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
      currentOrderId: localStorage.getItem('currentOrderId'),
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
      const currentOrderId = localStorage.getItem('currentOrderId');
      
      if (!currentOrderId) {
        setError('order.not_found');
        setLoading(false);
        return;
      }
      
      // 2. Fetch the pending order and update its status to "cart"
      const updateOrderToCart = async () => {
        try {
          console.log('Updating order to cart status:', currentOrderId);
          const academyId = ACADEMY;
          
          // Update the order status to "cart"
          const orderRef = doc(db, ACADEMIES_COLLECTION, academyId, 'orders', currentOrderId);
          
          await updateDoc(orderRef, {
            status: "cart",
            updatedAt: serverTimestamp()
          });
          
          console.log('Successfully updated order status to cart');
          
          // Clear purchasedCourseIds from localStorage to prevent accidental enrollment
          localStorage.removeItem('purchasedCourseIds');
          
          // Fetch the order to get the items for the cart
          const orderDoc = await getDoc(orderRef);
          
          if (!orderDoc.exists()) {
            console.error('Order not found after update:', currentOrderId);
            setError('order.pending_not_found');
            setLoading(false);
            return;
          }
          
          const orderData = orderDoc.data();
          console.log('Order data retrieved successfully:', orderData);
          
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
          console.error('Error updating order to cart status:', err);
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
      
      updateOrderToCart();
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
      const response = await fetch(`${backendUrl}/Payments/session-status?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify payment status');
      }
      
      const data = await response.json();
      
      // Set the status from the API response
      setStatus(data.status);
      
      if (data.customer_email) {
        setCustomerEmail(data.customer_email);
      }
      
      if (data.status === 'complete') {
        // Get the order ID associated with this session
        const orderId = data.orderId || localStorage.getItem('currentOrderId');
        
        if (!orderId) {
          setError('Could not find order information.');
          setLoading(false);
          return;
        }
        
        try {
          // Get the order details
          const orderDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', orderId));
          
          if (!orderDoc.exists()) {
            setError('Order not found.');
            setLoading(false);
            return;
          }
          
          const orderData = orderDoc.data();
          
          // Update order to 'completed' status
          await updateDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', orderId), {
            status: 'completed',
            paidAt: serverTimestamp(),
            paymentMethod: 'stripe',
            stripeSessionId: sessionId
          });
          
          if (user) {
            // Extract course IDs from the order items
            let courseIds: string[] = [];

            // Handle different possible formats of order items
            if (orderData.items && Array.isArray(orderData.items)) {
              // Standard format: items is an array of OrderItem objects with courseId property
              courseIds = orderData.items.map((item: OrderItem) => item.courseId);
            } else if (orderData.courses && Array.isArray(orderData.courses)) {
              // Alternative format: courses is an array of course objects with id property
              courseIds = orderData.courses.map((course: CourseItem) => course.id);
            } else if (orderData.courseIds && Array.isArray(orderData.courseIds)) {
              // Simple format: courseIds is an array of strings
              courseIds = orderData.courseIds;
            }

            console.log('Extracted course IDs from order:', courseIds);

            // Only proceed if we have course IDs
            if (courseIds.length === 0) {
              console.error('No course IDs found in order data:', orderData);
              
              // FALLBACK: Try to extract course IDs directly from the raw order data
              console.log('Attempting to extract course IDs from raw order data:', orderData);
              
              // Look for any property that might contain course IDs
              for (const key in orderData) {
                if (Array.isArray(orderData[key])) {
                  console.log(`Found array in property ${key}:`, orderData[key]);
                  
                  // Try to extract course IDs from this array
                  const possibleItems = orderData[key];
                  for (const item of possibleItems) {
                    if (typeof item === 'object' && item !== null) {
                      if (item.courseId) {
                        courseIds.push(item.courseId);
                        console.log('Found courseId in item:', item.courseId);
                      } else if (item.id) {
                        courseIds.push(item.id);
                        console.log('Found id in item:', item.id);
                      }
                    } else if (typeof item === 'string') {
                      // This might be a direct course ID
                      courseIds.push(item);
                      console.log('Found possible course ID string:', item);
                    }
                  }
                }
              }
              
              // If we still have no course IDs, check if there's a line_items property in the Stripe data
              if (courseIds.length === 0 && data.line_items && Array.isArray(data.line_items)) {
                console.log('Attempting to extract course IDs from Stripe line_items:', data.line_items);
                
                // Try to extract course IDs from line_items
                for (const item of data.line_items) {
                  if (item.price && item.price.product && item.price.product.metadata) {
                    const metadata = item.price.product.metadata;
                    if (metadata.courseId) {
                      courseIds.push(metadata.courseId);
                      console.log('Found courseId in Stripe metadata:', metadata.courseId);
                    }
                  }
                }
              }
              
              // If we still have no course IDs, use a hardcoded fallback for testing
              if (courseIds.length === 0) {
                // Check localStorage for any course IDs
                const purchasedCourseIds = localStorage.getItem('purchasedCourseIds');
                if (purchasedCourseIds) {
                  try {
                    const parsedIds = JSON.parse(purchasedCourseIds);
                    if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                      courseIds = parsedIds;
                      console.log('Using course IDs from localStorage:', courseIds);
                    }
                  } catch (error) {
                    console.error('Error parsing purchasedCourseIds from localStorage:', error);
                  }
                }
              }
              
              // Final fallback - if we still have no course IDs, show an error
              if (courseIds.length === 0) {
                setError('No courses found in your order. Please contact support.');
                setLoading(false);
                return;
              }
            }
            
            // Enroll user in courses
            console.log('Attempting to enroll user in courses:', courseIds);
            try {
              const enrollmentResult = await enrollUserInCourses(user.uid, courseIds);
              
              if (enrollmentResult.success) {
                console.log('Successfully enrolled user in courses:', courseIds);
                
                // Fetch course details for display
                const enrolledCoursesDetails = await Promise.all(
                  courseIds.map(async (courseId: string) => {
                    try {
                      const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
                      if (courseDoc.exists()) {
                        const courseData = courseDoc.data();
                        return {
                          id: courseId,
                          title: courseData.title || '',
                          description: courseData.description || '',
                          instructor: courseData.instructor || '',
                          thumbnail: courseData.thumbnail || '',
                          slug: courseData.slug || courseId // Use courseId as fallback if slug is not available
                        } as CourseDetails;
                      }
                    } catch (error) {
                      console.error(`Error fetching course ${courseId}:`, error);
                    }
                    return null;
                  })
                );
                
                // Filter out any null values and set the enrolled courses state
                const validCourses = enrolledCoursesDetails.filter(course => course !== null) as CourseDetails[];
                console.log('Enrolled courses:', validCourses);
                setEnrolledCourses(validCourses);
                console.log('Setting enrolled courses:', validCourses);
                setEnrollmentStatus('success');
                console.log('Setting enrollment status to success');
                
                // Increment enrolled count for each course
                for (const courseId of courseIds) {
                  try {
                    await incrementEnrolledCount(courseId);
                  } catch (error) {
                    console.error(`Error incrementing enrolled count for course ${courseId}:`, error);
                  }
                }
                
                // Clear the cart and pending order ID
                clearCart();
                localStorage.removeItem('currentOrderId');
                localStorage.removeItem('purchasedCourseIds');
              } else {
                console.error('Failed to enroll user in courses:', enrollmentResult.error);
                
                // Try a direct enrollment as a fallback
                console.log('Attempting direct enrollment as fallback...');
                try {
                  // Get the user document reference
                  const userRef = doc(db, ACADEMIES_COLLECTION, ACADEMY, "users", user.uid);
                  
                  // Check if user exists
                  const userDoc = await getDoc(userRef);
                  if (!userDoc.exists()) {
                    // Create user if they don't exist
                    await setDoc(userRef, {
                      email: user.email,
                      enrolledCourses: courseIds,
                      createdAt: serverTimestamp()
                    });
                    console.log('Created new user and enrolled in courses:', courseIds);
                  } else {
                    // Update existing user
                    await updateDoc(userRef, {
                      enrolledCourses: arrayUnion(...courseIds)
                    });
                    console.log('Updated existing user with courses:', courseIds);
                  }
                  
                  // Fetch course details for display
                  const enrolledCoursesDetails = await Promise.all(
                    courseIds.map(async (courseId: string) => {
                      try {
                        const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
                        if (courseDoc.exists()) {
                          const courseData = courseDoc.data();
                          return {
                            id: courseId,
                            title: courseData.title || '',
                            description: courseData.description || '',
                            instructor: courseData.instructor || '',
                            thumbnail: courseData.thumbnail || '',
                            slug: courseData.slug || courseId
                          } as CourseDetails;
                        }
                      } catch (error) {
                        console.error(`Error fetching course ${courseId}:`, error);
                      }
                      return null;
                    })
                  );
                  
                  // Filter out any null values and set the enrolled courses state
                  const validCourses = enrolledCoursesDetails.filter(course => course !== null) as CourseDetails[];
                  setEnrolledCourses(validCourses);
                  setEnrollmentStatus('success');
                  
                  // Increment enrolled count for each course
                  for (const courseId of courseIds) {
                    try {
                      await incrementEnrolledCount(courseId);
                    } catch (error) {
                      console.error(`Error incrementing enrolled count for course ${courseId}:`, error);
                    }
                  }
                  
                  // Clear the cart and pending order ID
                  clearCart();
                  localStorage.removeItem('currentOrderId');
                  localStorage.removeItem('purchasedCourseIds');
                } catch (fallbackError) {
                  console.error('Fallback enrollment failed:', fallbackError);
                  setError('Payment successful, but there was an issue enrolling you in some courses. Our team has been notified and will fix this shortly.');
                  setEnrollmentStatus('error');
                  
                  // Log this to a special collection for admin attention
                  await addDoc(collection(db, ACADEMIES_COLLECTION, ACADEMY, 'enrollmentErrors'), {
                    userId: user.uid,
                    orderId: orderId,
                    error: `Original error: ${enrollmentResult.error}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
                    timestamp: serverTimestamp()
                  });
                }
              }
            } catch (enrollError) {
              console.error('Error in enrollment process:', enrollError);
              setError('Payment successful, but there was an issue enrolling you in some courses. Our team has been notified and will fix this shortly.');
              setEnrollmentStatus('error');
              
              // Log this to a special collection for admin attention
              await addDoc(collection(db, ACADEMIES_COLLECTION, ACADEMY, 'enrollmentErrors'), {
                userId: user.uid,
                orderId: orderId,
                error: enrollError instanceof Error ? enrollError.message : 'Unknown enrollment error',
                timestamp: serverTimestamp()
              });
            }
          } else {
            setError('User not authenticated. Please log in to complete enrollment.');
          }
        } catch (error) {
          console.error('Error processing successful payment:', error);
          setError('Error processing payment. Please contact support.');
          setEnrollmentStatus('error');
        }
        
        setLoading(false);
      } else {
        setError('Payment verification failed. Please contact support.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error verifying session:', err);
      setError('Error verifying payment. Please contact support.');
      setLoading(false);
    }
  };

  // Update the loadCoursesFromLocalStorage function to ensure it enrolls users in courses
  const loadCoursesFromLocalStorage = async () => {
    console.log('Attempting to load courses from localStorage');
    const purchasedCourseIds = localStorage.getItem('purchasedCourseIds');
    
    if (purchasedCourseIds && user) {
      try {
        const courseIds = JSON.parse(purchasedCourseIds);
        console.log('Found course IDs in localStorage:', courseIds);
        
        if (Array.isArray(courseIds) && courseIds.length > 0) {
          // First, enroll the user in these courses
          console.log('Enrolling user in courses from localStorage:', courseIds);
          try {
            // Try using the enrollUserInCourses function first
            const enrollmentResult = await enrollUserInCourses(user.uid, courseIds);
            
            if (!enrollmentResult.success) {
              console.error('Failed to enroll user using enrollUserInCourses:', enrollmentResult.error);
              
              // Try direct enrollment as fallback
              console.log('Attempting direct enrollment as fallback...');
              const userRef = doc(db, ACADEMIES_COLLECTION, ACADEMY, "users", user.uid);
              
              // Check if user exists
              const userDoc = await getDoc(userRef);
              if (!userDoc.exists()) {
                // Create user if they don't exist
                await setDoc(userRef, {
                  email: user.email,
                  enrolledCourses: courseIds,
                  createdAt: serverTimestamp()
                });
                console.log('Created new user and enrolled in courses:', courseIds);
              } else {
                // Update existing user
                await updateDoc(userRef, {
                  enrolledCourses: arrayUnion(...courseIds)
                });
                console.log('Updated existing user with courses:', courseIds);
              }
            } else {
              console.log('Successfully enrolled user in courses using enrollUserInCourses');
            }
          } catch (enrollError) {
            console.error('Error enrolling user in courses from localStorage:', enrollError);
          }
          
          // Fetch course details for these IDs
          const enrolledCoursesDetails = await Promise.all(
            courseIds.map(async (courseId: string) => {
              try {
                const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
                if (courseDoc.exists()) {
                  const courseData = courseDoc.data();
                  return {
                    id: courseId,
                    title: courseData.title || courseId,
                    description: courseData.description || '',
                    instructor: courseData.instructor || '',
                    thumbnail: courseData.thumbnail || '',
                    slug: courseData.slug || courseId
                  } as CourseDetails;
                }
              } catch (error) {
                console.error(`Error fetching course ${courseId}:`, error);
              }
              
              // Fallback if course fetch fails
              return {
                id: courseId,
                title: `Course ${courseId}`,
                description: 'Course description not available',
                instructor: '',
                slug: courseId
              } as CourseDetails;
            })
          );
          
          // Filter out any null values
          const validCourses = enrolledCoursesDetails.filter(course => course !== null) as CourseDetails[];
          console.log('Loaded courses from localStorage:', validCourses);
          
          // Set the enrolled courses
          setEnrolledCourses(validCourses);
          setEnrollmentStatus('success');
          
          // Increment enrolled count for each course
          for (const courseId of courseIds) {
            try {
              await incrementEnrolledCount(courseId);
            } catch (error) {
              console.error(`Error incrementing enrolled count for course ${courseId}:`, error);
            }
          }
          
          return true;
        }
      } catch (error) {
        console.error('Error parsing purchasedCourseIds from localStorage:', error);
      }
    } else if (!user) {
      console.error('Cannot enroll courses: User not authenticated');
    }
    
    console.log('No valid course IDs found in localStorage or user not authenticated');
    return false;
  };

  // Call this function immediately when the component mounts
  useEffect(() => {
    // Only attempt to load and enroll courses if payment was successful
    if (status === 'complete' && enrolledCourses.length === 0 && !loading) {
      loadCoursesFromLocalStorage();
    }
  }, [enrolledCourses.length, loading, status]);

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
            <div className="mb-6">
              {enrollmentStatus === 'success' && (
                <div className="mb-6">
                  <p className="text-green-600 mb-4 text-center font-semibold">
                    <FormattedMessage id="payment.return.enrollment.success" defaultMessage="You have been successfully enrolled in your courses!" />
                  </p>
                  
                  {enrolledCourses.length > 0 ? (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-3 text-center">
                        <FormattedMessage id="payment.return.courses.title" defaultMessage="Your Courses" />
                      </h3>
                      <div className="space-y-4">
                        {enrolledCourses.map(course => {
                          // Use the slug if available, otherwise generate a slug from the title or use the ID
                          const courseSlug = course.slug || 
                            (course.title ? course.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : course.id);
                          
                          return (
                            <div key={course.id} className="border rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center">
                                <BookOpen className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                                  {course.instructor && (
                                    <p className="text-sm text-gray-500">{course.instructor}</p>
                                  )}
                                </div>
                              </div>
                              <Link 
                                to={`/courses/${courseSlug}/learn`} 
                                className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <FormattedMessage id="payment.return.start.learning" defaultMessage="Start Learning" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
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

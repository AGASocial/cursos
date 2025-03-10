import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, BookOpen, ArrowLeft } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { CourseDetails, enrollUserInCourses } from '../../lib/users';
import { incrementEnrolledCount } from '../../lib/courses';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

// Define the OrderItem interface
interface OrderItem {
  courseId: string;
  title: string;
  price: number;
}

export const PaymentSuccess = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchasedCourses, setPurchasedCourses] = useState<CourseDetails[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPurchasedCourses = async () => {
      try {
        // If we have a specific courseId, fetch just that course
        if (courseId) {
          const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
          if (courseDoc.exists()) {
            const courseData = courseDoc.data();
            setPurchasedCourses([{
              id: courseId,
              title: courseData.title || '',
              description: courseData.description || '',
              instructor: courseData.instructor || '',
              thumbnail: courseData.thumbnail || '',
              slug: courseData.slug || ''
            }]);
          }
        } else {
          // Otherwise, find the most recent completed order
          const ordersRef = collection(db, ACADEMIES_COLLECTION, ACADEMY, 'orders');
          const q = query(
            ordersRef, 
            where('userId', '==', user.uid),
            where('status', '==', 'completed')
          );
          
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            // Get the most recent order (assuming they're sorted by timestamp)
            const recentOrder = snapshot.docs[0];
            const orderData = recentOrder.data();
            
            // Fetch details for each course in the order
            const coursePromises = orderData.items.map(async (item: OrderItem) => {
              const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', item.courseId));
              if (courseDoc.exists()) {
                const courseData = courseDoc.data();
                return {
                  id: item.courseId,
                  title: courseData.title || '',
                  description: courseData.description || '',
                  instructor: courseData.instructor || '',
                  thumbnail: courseData.thumbnail || '',
                  slug: courseData.slug || ''
                };
              }
              return null;
            });
            
            const courses = await Promise.all(coursePromises);
            setPurchasedCourses(courses.filter(course => course !== null) as CourseDetails[]);
          }
        }
      } catch (error) {
        console.error('Error fetching purchased courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, [courseId, user, navigate]);

  // Update the loadCoursesFromLocalStorage function to ensure it enrolls users in courses
  const loadCoursesFromLocalStorage = async () => {
    console.log('Attempting to load courses from localStorage in PaymentSuccess');
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
          const coursesDetails = await Promise.all(
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
          const validCourses = coursesDetails.filter(course => course !== null) as CourseDetails[];
          console.log('Loaded courses from localStorage:', validCourses);
          
          // Set the purchased courses
          setPurchasedCourses(validCourses);
          
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

  // Call this function when the component mounts if no courses are found
  useEffect(() => {
    if (purchasedCourses.length === 0 && !loading) {
      loadCoursesFromLocalStorage();
    }
  }, [purchasedCourses.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-center text-gray-900">
            <FormattedMessage id="payment.success.title" defaultMessage="Payment Successful!" />
          </h1>
          
          <p className="mt-4 text-lg text-center text-gray-600">
            <FormattedMessage 
              id="payment.success.message" 
              defaultMessage="Thank you for your purchase. You can now access your course(s)."
            />
          </p>

          {purchasedCourses.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                <FormattedMessage id="payment.success.your-courses" defaultMessage="Your Courses" />
              </h2>
              
              <div className="space-y-4">
                {purchasedCourses.map(course => (
                  <div key={course.id} className="border rounded-lg p-4 bg-gray-50 flex items-center">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{course.title}</h3>
                      {course.instructor && (
                        <p className="text-sm text-gray-500">{course.instructor}</p>
                      )}
                    </div>
                    <Link to={`/courses/${course.slug}/learn`}>
                      <Button className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          <FormattedMessage id="payment.success.start-learning" defaultMessage="Start Learning" />
                        </span>
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Link to="/courses">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>
                  <FormattedMessage id="payment.success.browse-more" defaultMessage="Browse More Courses" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

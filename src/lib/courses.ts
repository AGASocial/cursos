import { collection, getDocs, query, orderBy, where, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  enrolledCount: number;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  aboutCourse: string;
  learningObjectives: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getCourses = async () => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      enrolledCount: doc.data().enrolledCount || 0, // Ensure enrolledCount has a default value
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Course[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      return null;
    }

    return {
      id: courseDoc.id,
      ...courseDoc.data(),
      enrolledCount: courseDoc.data().enrolledCount || 0, // Ensure enrolledCount has a default value
      createdAt: courseDoc.data().createdAt?.toDate(),
      updatedAt: courseDoc.data().updatedAt?.toDate()
    } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

export const incrementEnrolledCount = async (courseId: string): Promise<boolean> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      enrolledCount: increment(1)
    });
    return true;
  } catch (error) {
    console.error('Error incrementing enrolled count:', error);
    return false;
  }
};

export const getEnrolledUsers = async (courseId: string): Promise<string[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('enrolledCourses', 'array-contains', courseId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data().email);
  } catch (error) {
    console.error('Error fetching enrolled users:', error);
    return [];
  }
};
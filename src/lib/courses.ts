import { collection, getDocs, query, where, serverTimestamp, doc, getDoc, updateDoc, orderBy, increment } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export interface Course {
  id: string;
  status: 'draft' | 'published';
  title: string;
  slug: string;
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
    const academyId = ACADEMY;
    const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const q = query(
      coursesRef,
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      enrolledCount: doc.data().enrolledCount || 0,
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Course[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const getAllCourses = async () => {
  try {
    const academyId = ACADEMY;
    const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const q = query(coursesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      enrolledCount: doc.data().enrolledCount || 0,
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
    const academyId = ACADEMY;
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      return null;
    }

    return {
      id: courseDoc.id,
      ...courseDoc.data(),
      enrolledCount: courseDoc.data().enrolledCount || 0,
      createdAt: courseDoc.data().createdAt?.toDate(),
      updatedAt: courseDoc.data().updatedAt?.toDate()
    } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

export const getCourseBySlug = async (slug: string): Promise<Course | null> => {
  try {
    const academyId = ACADEMY;
    if (!academyId) {
      console.error('Academy ID is not defined');
      return null;
    }

    if (!slug) {
      console.error('Slug is required');
      return null;
    }

    const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const q = query(
      coursesRef,
      where('slug', '==', slug.toLowerCase())
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No course found with slug:', slug);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      enrolledCount: data.enrolledCount || 0,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Course;
  } catch (error) {
    console.error('Error getting course by slug:', error);
    return null;
  }
};

export const incrementEnrolledCount = async (courseId: string): Promise<boolean> => {
  try {
    const academyId = ACADEMY;
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    await updateDoc(courseRef, {
      enrolledCount: increment(1)
    });
    return true;
  } catch (error) {
    console.error('Error incrementing enrolled count:', error);
    return false;
  }
};

export const updateCourseStatus = async (courseId: string, status: 'draft' | 'published'): Promise<boolean> => {
  try {
    const academyId = ACADEMY;
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    await updateDoc(courseRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating course status:', error);
    return false;
  }
};

export const getEnrolledUsers = async (courseId: string): Promise<string[]> => {
  try {
    const academyId = ACADEMY;
    const usersRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users');
    const q = query(usersRef, where('enrolledCourses', 'array-contains', courseId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data().email);
  } catch (error) {
    console.error('Error fetching enrolled users:', error);
    return [];
  }
};
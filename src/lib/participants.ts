import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

interface Participant {
  id: string;
  email: string;
  name: string;
}

export const getEnrolledUsers = async (courseId: string): Promise<Participant[]> => {
  try {
    const academyId = ACADEMY;
    const usersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'users');
    const q = query(usersRef, where('enrolledCourses', 'array-contains', courseId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().displayName || ''
    }));
  } catch (error) {
    console.error('Error fetching enrolled users:', error);
    return [];
  }
};

export const addParticipant = async (courseId: string, email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Find user by email
    const academyId = ACADEMY;
    const usersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { 
        success: false, 
        error: 'User not found'
      };
    }

    const userDoc = snapshot.docs[0];
    
    // Check if already enrolled
    const userData = userDoc.data();
    if (userData.enrolledCourses?.includes(courseId)) {
      return {
        success: false,
        error: 'User is already enrolled in this course'
      };
    }

    // Add course to user's enrolledCourses
    await updateDoc(doc(db, ACADEMIES_COLLECTION, academyId, 'users', userDoc.id), {
      enrolledCourses: arrayUnion(courseId)
    });

    // Increment course enrolledCount
    const courseRef = doc(db,  ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    await updateDoc(courseRef, {
      enrolledCount: increment(1)
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding participant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add participant'
    };
  }
};

export const removeParticipant = async (courseId: string, userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Remove course from user's enrolledCourses
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users', userId);
    await updateDoc(userRef, {
      enrolledCourses: arrayRemove(courseId)
    });

    // Decrement course enrolledCount
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    await updateDoc(courseRef, {
      enrolledCount: increment(-1) // Keep this as is, it's correct
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing participant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove participant'
    };
  }
};

export const exportParticipants = (participants: Participant[], courseName: string): void => {
  // Add BOM for UTF-8
  const BOM = '\uFEFF';
  const csvContent = [
    ['Name', 'Email'],
    ...participants.map(p => [p.name || '', p.email])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${courseName.toLowerCase().replace(/\s+/g, '-')}-participants.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
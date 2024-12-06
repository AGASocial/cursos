import { doc, updateDoc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
  enrolledCourses: string[];
  email: string;
  createdAt: Date;
}

export const createUser = async (userId: string, email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email,
      enrolledCourses: [],
      createdAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    return {
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate(),
    } as UserData;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const addCourseToUser = async (
  userId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    await updateDoc(userRef, {
      enrolledCourses: arrayUnion(courseId)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding course to user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add course to user'
    };
  }
};
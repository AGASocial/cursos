import { doc, updateDoc, arrayUnion, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updateProfile, updatePassword as firebaseUpdatePassword } from 'firebase/auth';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export interface UserData {
  enrolledCourses: string[];
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export const createUser = async (userId: string, email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users', userId);
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
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users', userId);
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
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users', userId);
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

export const updateUserProfile = async (
  data: { displayName?: string; photoFile?: File }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    let photoURL = user.photoURL;
    let updates = {};

    if (data.photoFile) {
      const timestamp = Date.now();
      const filename = `${timestamp}-${data.photoFile.name}`;
      const storageRef = ref(storage, `profile-images/${user.uid}/${filename}`);
      
      const uploadResult = await uploadBytes(storageRef, data.photoFile);
      photoURL = await getDownloadURL(uploadResult.ref);
      updates = { ...updates, photoURL };
    }

    if (data.displayName) {
      updates = { ...updates, displayName: data.displayName };
    }

    // Update auth profile
    await updateProfile(user, updates);

    // Update Firestore document
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, 'users', user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password'
    };
  }
};
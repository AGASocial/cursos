import { collection, getDocs, query, where, serverTimestamp, doc, updateDoc, arrayUnion, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';

export interface Academy {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  createdAt: Date;
}

export const setCurrentAcademy = async (
  userId: string,
  academyId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      currentAcademy: academyId
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting current academy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set current academy'
    };
  }
};
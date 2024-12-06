import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createChapter = async (
  courseId: string,
  data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; chapterId?: string; error?: string }> => {
  try {
    const chaptersRef = collection(db, 'courses', courseId, 'chapters');
    const docRef = await addDoc(chaptersRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, chapterId: docRef.id };
  } catch (error) {
    console.error('Error creating chapter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chapter',
    };
  }
};

export const getCourseChapters = async (courseId: string): Promise<Chapter[]> => {
  try {
    if (!courseId) {
      console.error('No courseId provided to getCourseChapters');
      return [];
    }

    const chaptersRef = collection(db, 'courses', courseId, 'chapters');
    const q = query(chaptersRef, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Chapter[];
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
};

export const updateChapter = async (
  courseId: string,
  chapterId: string,
  data: Partial<Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId);
    await updateDoc(chapterRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating chapter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update chapter',
    };
  }
};

export const deleteChapter = async (
  courseId: string,
  chapterId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId);
    await deleteDoc(chapterRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chapter',
    };
  }
};
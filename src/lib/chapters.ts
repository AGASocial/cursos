import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc, deleteDoc,serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

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
  data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'order'>
): Promise<{ success: boolean; chapterId?: string; error?: string }> => {
  try {
    const academyId = ACADEMY;
    // Get current chapters to determine next order
    const chapters = await getCourseChapters(courseId);
    const nextOrder = chapters.length > 0 
      ? Math.max(...chapters.map(ch => ch.order)) + 1 
      : 0;

    const chaptersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters');
    const docRef = await addDoc(chaptersRef, {
      ...data,
      order: nextOrder,
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
    const academyId = ACADEMY;
    const chaptersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters');
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

export const getChapter = async (courseId: string, chapterId: string): Promise<Chapter | null> => {
  try {
    const academyId = ACADEMY;
    const chapterRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      return null;
    }

    return {
      id: chapterDoc.id,
      ...chapterDoc.data(),
      createdAt: chapterDoc.data().createdAt?.toDate(),
      updatedAt: chapterDoc.data().updatedAt?.toDate()
    } as Chapter;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
};

export const updateChapter = async (
  courseId: string,
  chapterId: string,
  data: Partial<Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const chapterRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters', chapterId);
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
    const academyId = ACADEMY;
    const chapterRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters', chapterId);
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

export const reorderChapters = async (
  courseId: string,
  orderedChapterIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    // Update each chapter's order in parallel
    await Promise.all(
      orderedChapterIds.map((chapterId, index) => {
    const chapterRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters', chapterId);
        return updateDoc(chapterRef, {
          order: index,
          updatedAt: serverTimestamp()
        });
      })
    );
    return { success: true };
  } catch (error) {
    console.error('Error reordering chapters:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder chapters'
    };
  }
};

export const exportChapter = (chapter: Chapter): void => {
  const chapterData = {
    title: chapter.title,
    content: chapter.content,
    order: chapter.order
  };
  
  const blob = new Blob([JSON.stringify(chapterData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${chapter.title.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importChapter = async (
  courseId: string,
  file: File
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        error: 'Please upload a JSON file'
      };
    }

    const content = await file.text();
    let chapterData;
    try {
      chapterData = JSON.parse(content);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid JSON file format'
      };
    }

    const requiredFields = ['title', 'content'];
    const missingFields = requiredFields.filter(field => !chapterData[field]);
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Get current max order
    const chapters = await getCourseChapters(courseId);
    const maxOrder = chapters.reduce((max, ch) => Math.max(max, ch.order), -1);

    // Create chapter with next order
    const result = await createChapter(courseId, {
      title: `${chapterData.title} (imported)`,
      content: chapterData.content,
      order: maxOrder + 1
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error importing chapter:', error);
    return {
      success: false,
      error: 'Failed to import chapter. Please try again.'
    };
  }
};
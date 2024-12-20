import { collection, addDoc, updateDoc, doc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Course } from './courses';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

type CourseInput = Omit<Course, 'id' | 'enrolledCount' | 'createdAt' | 'updatedAt' | 'thumbnail'>;

export const createCourse = async (
  courseData: CourseInput,
  thumbnailFile: File
): Promise<{ success: boolean; courseId?: string; error?: string }> => {
  try {
    // Create a unique filename for the thumbnail
    const timestamp = Date.now();
    const filename = `${timestamp}-${thumbnailFile.name}`;
    const storageRef = ref(storage, `course-thumbnails/${filename}`);

    // Upload thumbnail
    const uploadResult = await uploadBytes(storageRef, thumbnailFile);
    const thumbnailUrl = await getDownloadURL(uploadResult.ref);

    // Create course with thumbnail URL and additional metadata
    const academyId = ACADEMY;
    const courseRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const docRef = await addDoc(courseRef, {
      ...courseData,
      thumbnail: thumbnailUrl,
      enrolledCount: 0, // Initialize enrolledCount to 0
      status: 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, courseId: docRef.id };
  } catch (error) {
    console.error('Error creating course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course',
    };
  }
};

export const updateCourse = async (
  courseId: string,
  courseData: CourseInput,
  thumbnailFile: File | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);
    const updateData: any = {
      ...courseData,
      status: courseData.status || 'draft',
      updatedAt: serverTimestamp(),
    };

    if (thumbnailFile) {
      // Upload new thumbnail if provided
      const timestamp = Date.now();
      const filename = `${timestamp}-${thumbnailFile.name}`;
      const storageRef = ref(storage, `course-thumbnails/${filename}`);
      const uploadResult = await uploadBytes(storageRef, thumbnailFile);
      updateData.thumbnail = await getDownloadURL(uploadResult.ref);
    }

    await updateDoc(courseRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course',
    };
  }
};

export const deleteCourse = async (courseId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const courseRef = doc(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId);

    // Delete all chapters
    const chaptersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    
    const deletePromises = chaptersSnapshot.docs.map(chapterDoc => deleteDoc(chapterDoc.ref));
    await Promise.all(deletePromises);
    
    // Delete the course document
    await deleteDoc(courseRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course'
    };
  }
};
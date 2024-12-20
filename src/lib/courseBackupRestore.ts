import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { type Course } from './courses';
import { type Chapter } from './chapters';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

interface CourseBackup {
  course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'enrolledCount'>;
  chapters: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>[];
}

export const backupCourse = async (courseId: string, course: Course): Promise<void> => {
  try {
    // Get all chapters
    const academyId = ACADEMY;
    const chaptersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses', courseId, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    const chapters = chaptersSnapshot.docs.map(doc => ({
      title: doc.data().title,
      content: doc.data().content,
      order: doc.data().order
    }));

    // Prepare backup data
    const backupData: CourseBackup = {
      course: {
        title: course.title,
        instructor: course.instructor,
        thumbnail: course.thumbnail,
        duration: course.duration,
        price: course.price,
        category: course.category,
        level: course.level,
        description: course.description,
        aboutCourse: course.aboutCourse,
        learningObjectives: course.learningObjectives,
        status: 'draft' // Always restore as draft
      },
      chapters
    };

    // Create and download backup file
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${course.title.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const restoreCourse = async (file: File): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate file type
    if (!file.name.endsWith('.json')) {
      return {
        success: false,
        error: 'Please upload a JSON file'
      };
    }

    // Read and parse file
    const content = await file.text();
    let backupData: CourseBackup;
    try {
      backupData = JSON.parse(content);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid JSON file format'
      };
    }

    // Validate backup data structure
    if (!backupData?.course || !Array.isArray(backupData?.chapters)) {
      return {
        success: false,
        error: 'Invalid backup file structure'
      };
    }

    // Validate required course fields
    const requiredFields = [
      'title', 'instructor', 'duration', 'price', 
      'category', 'level', 'description', 'aboutCourse', 
      'learningObjectives'
    ];
    
    const missingFields = requiredFields.filter(field => !backupData.course[field]);
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate chapter structure
    const requiredChapterFields = ['title', 'content', 'order'];
    const invalidChapters = backupData.chapters.some(
      chapter => {
        // Basic type checks
        if (!chapter || typeof chapter !== 'object') return true;
        
        // Check required fields exist and are the correct type
        if (!chapter.title || typeof chapter.title !== 'string') return true;
        if (!chapter.content || typeof chapter.content !== 'string') return true;
        
        // Additional validation
        if (chapter.title.trim().length === 0) return true;
        if (chapter.order !== undefined && typeof chapter.order !== 'number') return true;
        
        return false;
      }
    );
    
    if (invalidChapters) {
      return {
        success: false,
        error: 'Each chapter must have a valid title and content'
      };
    }

    // Create course
    const academyId = ACADEMY;
    const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
    const courseDoc = await addDoc(coursesRef, {
      ...backupData.course,
      title: `${backupData.course.title} (restored)`,
      status: 'draft', // Always restore as draft
      price: Number(backupData.course.price),
      enrolledCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      thumbnail: backupData.course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&h=600&fit=crop'
    });

    // Create chapters
    const chaptersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses', courseDoc.id, 'chapters');
    await Promise.all(backupData.chapters.map((chapter, index) =>
      addDoc(chaptersRef, {
        title: (chapter.title || '').trim(),
        content: chapter.content,
        order: typeof chapter.order === 'number' ? chapter.order : index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    ));

    return { success: true };
  } catch (error) {
    console.error('Error restoring backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore backup. Please try again.'
    };
  }
};
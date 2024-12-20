import { type Course } from './courses';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export const exportCourse = (course: Course): void => {
  const courseData = {
    title: course.title,
    instructor: course.instructor,
    duration: course.duration,
    price: course.price,
    category: course.category,
    level: course.level,
    description: course.description,
    aboutCourse: course.aboutCourse,
    learningObjectives: course.learningObjectives
  };
  
  const blob = new Blob([JSON.stringify(courseData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${course.title.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importCourse = async (file: File): Promise<{ success: boolean; error?: string }> => {
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
    let courseData;
    try {
      courseData = JSON.parse(content);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid JSON file format'
      };
    }
    
    // Validate required fields
    const requiredFields = [
      'title', 'instructor', 'duration', 'price', 
      'category', 'level', 'description', 'aboutCourse', 
      'learningObjectives'
    ];
    
    const missingFields = requiredFields.filter(field => !courseData[field]);
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Clean course data
    const { id, createdAt, updatedAt, ...cleanCourseData } = courseData;

    try {
      // Create course directly in Firestore
      const academyId = ACADEMY;
      const coursesRef = collection(db, ACADEMIES_COLLECTION, academyId, 'courses');
      await addDoc(coursesRef, {
        ...cleanCourseData,
        title: `${cleanCourseData.title} (imported)`,
        status: 'draft',
        enrolledCount: 0,
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&h=600&fit=crop',
        price: Number(cleanCourseData.price),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating course:', error);
      return {
        success: false,
        error: 'Failed to create course in database'
      };
    }

  } catch (error) {
    console.error('Error importing course:', error);
    return {
      success: false,
      error: 'Failed to import course. Please try again.'
    };
  }
};
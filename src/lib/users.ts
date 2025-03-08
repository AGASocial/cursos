import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
} from "firebase/auth";

const ACADEMIES_COLLECTION =
  import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || "agaacademies";
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export interface UserData {
  enrolledCourses: string[];
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
}

export const createUser = async (
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, "users", userId);
    await setDoc(userRef, {
      email,
      enrolledCourses: [],
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate(),
    } as UserData;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const addCourseToUser = async (
  userId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }

    await updateDoc(userRef, {
      enrolledCourses: arrayUnion(courseId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding course to user:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add course to user",
    };
  }
};

export const updateUserProfile = async (data: {
  displayName?: string;
  photoFile?: File;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

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
    const userRef = doc(db, ACADEMIES_COLLECTION, academyId, "users", user.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
};

export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No user logged in");

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Update password
    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
};

export const enrollUserInCourses = async (
  userId: string,
  courseIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!userId) {
      return { success: false, error: "Se requiere ID de usuario" };
    }

    if (!courseIds || courseIds.length === 0) {
      return { success: false, error: "No se proporcionaron IDs de cursos" };
    }

    // Get the user document reference
    const userRef = doc(db, ACADEMIES_COLLECTION, ACADEMY, "users", userId);

    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: "Usuario no encontrado" };
    }

    // Get current enrolled courses
    const userData = userDoc.data();
    const currentEnrolledCourses = userData.enrolledCourses || [];
    
    // Filter out courses the user is already enrolled in
    const newCourseIds = courseIds.filter(
      courseId => !currentEnrolledCourses.includes(courseId)
    );
    
    console.log('Cursos actualmente inscritos:', currentEnrolledCourses);
    console.log('Cursos a inscribir:', courseIds);
    console.log('Nuevos cursos a inscribir:', newCourseIds);
    
    // If all courses are already enrolled, return success
    if (newCourseIds.length === 0) {
      console.log('El usuario ya está inscrito en todos los cursos especificados');
      return { success: true };
    }

    // Update the user's enrolledCourses array with the new course IDs
    await updateDoc(userRef, {
      enrolledCourses: arrayUnion(...newCourseIds)
    });

    return { success: true };
  } catch (error) {
    console.error("Error al inscribir usuario en cursos:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ocurrió un error desconocido",
    };
  }
};

export const isUserEnrolledInCourse = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    if (!userId || !courseId) {
      return false;
    }

    // Get the user document
    const userDoc = await getDoc(
      doc(db, ACADEMIES_COLLECTION, ACADEMY, "users", userId)
    );

    if (!userDoc.exists()) {
      return false;
    }

    const userData = userDoc.data();
    const enrolledCourses = userData.enrolledCourses || [];

    return enrolledCourses.includes(courseId);
  } catch (error) {
    console.error("Error checking course enrollment:", error);
    return false;
  }
};

// Define a type for course details
export interface CourseDetails {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  price?: number;
  thumbnail?: string;
  duration?: string;
  level?: string;
  category?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  slug?: string;
}

/**
 * Gets course details by IDs
 * @param courseIds Array of course IDs
 * @returns Promise that resolves to an array of course details
 */
export const getCourseDetailsByIds = async (courseIds: string[]): Promise<CourseDetails[]> => {
  try {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    const courses: CourseDetails[] = [];
    
    // Get each course document
    for (const courseId of courseIds) {
      try {
        const courseDoc = await getDoc(
          doc(db, ACADEMIES_COLLECTION, ACADEMY, "courses", courseId)
        );
        
        if (courseDoc.exists()) {
          courses.push({
            id: courseDoc.id,
            ...courseDoc.data()
          } as CourseDetails);
        }
      } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
      }
    }
    
    return courses;
  } catch (error) {
    console.error('Error getting course details:', error);
    return [];
  }
};

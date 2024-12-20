import { doc, getDoc, collection, query, getDocs, updateDoc, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const academyId = ACADEMY;
    console.log('Checking admin status:', {
      userId,
      academyId,
      collectionPath: `${ACADEMIES_COLLECTION}/${academyId}`
    });

    if (!academyId) {
      console.error('Academy ID is not set in environment variables');
      return false;
    }

    const academyRef = doc(db, ACADEMIES_COLLECTION, academyId);
    const academyDoc = await getDoc(academyRef);
    
    if (!academyDoc.exists()) {
      console.error('Academy document does not exist:', academyId);
      return false;
    }

    const academyData = academyDoc.data();
    console.log('Academy document data:', {
      exists: academyDoc.exists(),
      hasAdminsArray: Array.isArray(academyData?.admins),
      adminsLength: academyData?.admins?.length || 0,
      userIsAdmin: academyData?.admins?.includes(userId)
    });

    return academyDoc.exists() && academyData.admins?.includes(userId);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getAllAdmins = async (): Promise<{ id: string; email: string; displayName?: string; photoURL?: string }[]> => {
  try {
    const academyId = ACADEMY;
    const academyRef = doc(db, ACADEMIES_COLLECTION, academyId);
    const academyDoc = await getDoc(academyRef);
    
    if (!academyDoc.exists() || !academyDoc.data().admins) {
      return [];
    }

    const adminIds = academyDoc.data().admins;
    const usersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'users');
    const q = query(usersRef, where('__name__', 'in', adminIds));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName || '',
      photoURL: doc.data().photoURL || ''
    }));
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
};

export const addAdmin = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    
    // First check if user exists in academy's users collection
    const usersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { 
        success: false, 
        error: 'admin.error.notFound'
      };
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Check if already admin
    const academyRef = doc(db, ACADEMIES_COLLECTION, academyId);
    const academyDoc = await getDoc(academyRef);
    
    if (!academyDoc.exists()) {
      return {
        success: false,
        error: 'Academy not found'
      };
    }
    
    const academyData = academyDoc.data();
    if (academyData.admins?.includes(userId)) {
      return {
        success: false,
        error: 'admin.error.alreadyAdmin'
      };
    }

    // Add user to admins array
    await updateDoc(academyRef, {
      admins: arrayUnion(userId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'admin.error.unknown'
    };
  }
};

export const removeAdmin = async (
  adminId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (adminId === currentUserId) {
      return {
        success: false,
        error: 'admin.error.cannotRemoveSelf'
      };
    }

    const academyId = ACADEMY;
    const academyRef = doc(db, ACADEMIES_COLLECTION, academyId);
    
    // Remove the user's ID from the admins array in the academy document
    await updateDoc(academyRef, {
      admins: arrayRemove(adminId)
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing admin:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'admin.error.unknown'
    };
  }
};

export const verifyAcademySetup = async (): Promise<{ 
  success: boolean; 
  error?: string;
  academyId?: string;
  exists?: boolean;
  hasAdmins?: boolean;
}> => {
  try {
    const academyId = ACADEMY;
    
    if (!academyId) {
      return {
        success: false,
        error: 'Academy ID is not set in environment variables',
        academyId
      };
    }

    const academyRef = doc(db, ACADEMIES_COLLECTION, academyId);
    const academyDoc = await getDoc(academyRef);
    
    if (!academyDoc.exists()) {
      return {
        success: false,
        error: 'Academy document does not exist',
        academyId,
        exists: false
      };
    }

    const academyData = academyDoc.data();
    const hasAdmins = Array.isArray(academyData?.admins);

    if (!hasAdmins) {
      return {
        success: false,
        error: 'Academy document is missing admins array',
        academyId,
        exists: true,
        hasAdmins: false
      };
    }

    return {
      success: true,
      academyId,
      exists: true,
      hasAdmins: true
    };
  } catch (error) {
    console.error('Error verifying academy setup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error verifying academy setup'
    };
  }
};
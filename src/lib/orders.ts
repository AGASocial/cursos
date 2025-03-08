import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Course } from './courses';
import { addCourseToUser } from './users';
import { incrementEnrolledCount } from './courses';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: {
    courseId: string;
    title: string;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'completed';
  createdAt: Date;
}

export const createOrder = async (
  userId: string,
  userEmail: string,
  items: Course[],
  total: number
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const orderData = {
      userId,
      userEmail,
      items: items.map(item => ({
        courseId: item.id,
        title: item.title,
        price: item.price
      })),
      total,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    const academyId = ACADEMY;
    const orderRef = await addDoc(collection(db, ACADEMIES_COLLECTION, academyId, 'orders'), orderData);
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const academyId = ACADEMY;
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'orders');
    const q = query(ordersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const academyId = ACADEMY;
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
};

export const approveOrder = async (orderId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const orderRef = doc(db, ACADEMIES_COLLECTION, academyId, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data() as Order;

    // Add each course to the user's enrolledCourses and increment enrolled count
    const updatePromises = [];

    for (const item of orderData.items) {
      updatePromises.push(
        addCourseToUser(orderData.userId, item.courseId),
        incrementEnrolledCount(item.courseId)
      );
    }

    try {
      await Promise.all(updatePromises);
      
      // Update order status to completed
      await updateDoc(orderRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user courses:', error);
      return {
        success: false,
        error: 'admin.error.updateFailed'
      };
    }
  } catch (error) {
    console.error('Error approving order:', error);
    return {
      success: false,
      error: 'Failed to approve order. Please try again.'
    };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: 'pending' | 'completed'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const orderRef = doc(db, ACADEMIES_COLLECTION, academyId, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return { success: false, error: 'Order not found' };
    }

    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status'
    };
  }
};
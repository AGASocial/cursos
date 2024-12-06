import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, orderBy, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Course } from './courses';
import { addCourseToUser } from './users';
import { incrementEnrolledCount } from './courses';

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

    const orderRef = await addDoc(collection(db, 'orders'), orderData);
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
    const ordersRef = collection(db, 'orders');
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
    const ordersRef = collection(db, 'orders');
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
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return { success: false, error: 'Order not found' };
    }

    const orderData = orderDoc.data() as Order;

    // Add each course to the user's enrolledCourses and increment enrolled count
    for (const item of orderData.items) {
      const [addSuccess, incrementSuccess] = await Promise.all([
        addCourseToUser(orderData.userId, item.courseId),
        incrementEnrolledCount(item.courseId)
      ]);

      if (!addSuccess.success) {
        return { success: false, error: `Failed to add course ${item.courseId}: ${addSuccess.error}` };
      }

      if (!incrementSuccess) {
        console.error(`Failed to increment enrolled count for course ${item.courseId}`);
      }
    }

    // Update order status to completed
    await updateDoc(orderRef, {
      status: 'completed'
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve order'
    };
  }
};
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Course } from "./courses";
import { addCourseToUser } from "./users";
import { incrementEnrolledCount } from "./courses";

const ACADEMIES_COLLECTION =
  import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || "agaacademies";
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
  status: "cart" | "pending" | "completed";
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
      items: items.map((item) => ({
        courseId: item.id,
        title: item.title,
        price: item.price,
      })),
      total,
      status: "pending",
      createdAt: serverTimestamp(),
    };
    const academyId = ACADEMY;
    const orderRef = await addDoc(
      collection(db, ACADEMIES_COLLECTION, academyId, "orders"),
      orderData
    );
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
};

/**
 * Creates or updates a cart order in Firebase
 * @param userId The user ID
 * @param userEmail The user email
 * @param items The cart items
 * @param total The cart total
 * @returns Object with success status, order ID, and error message if any
 */
export const createOrUpdateCartOrder = async (
  userId: string,
  userEmail: string,
  items: Course[],
  total: number
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const academyId = ACADEMY;

    // Check if user already has a cart order
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId),
      where("status", "==", "cart")
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Update existing cart order
      const existingOrder = snapshot.docs[0];
      const orderRef = doc(
        db,
        ACADEMIES_COLLECTION,
        academyId,
        "orders",
        existingOrder.id
      );

      await updateDoc(orderRef, {
        items: items.map((item) => ({
          courseId: item.id,
          title: item.title,
          price: item.price,
        })),
        total,
        updatedAt: serverTimestamp(),
      });

      return { success: true, orderId: existingOrder.id };
    } else {
      // Create new cart order
      const orderData = {
        userId,
        userEmail,
        items: items.map((item) => ({
          courseId: item.id,
          title: item.title,
          price: item.price,
        })),
        total,
        status: "cart",
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(
        collection(db, ACADEMIES_COLLECTION, academyId, "orders"),
        orderData
      );
      return { success: true, orderId: orderRef.id };
    }
  } catch (error) {
    console.error("Error creating/updating cart order:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create/update cart order",
    };
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const academyId = ACADEMY;
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, "orders");
    const q = query(ordersRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Order[];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const academyId = ACADEMY;
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Order[];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
};

export const approveOrder = async (
  orderId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const orderRef = doc(
      db,
      ACADEMIES_COLLECTION,
      academyId,
      "orders",
      orderId
    );
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return { success: false, error: "Order not found" };
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
        status: "completed",
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating user courses:", error);
      return {
        success: false,
        error: "admin.error.updateFailed",
      };
    }
  } catch (error) {
    console.error("Error approving order:", error);
    return {
      success: false,
      error: "Failed to approve order. Please try again.",
    };
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: "cart" | "pending" | "completed"
): Promise<{ success: boolean; error?: string }> => {
  try {
    const academyId = ACADEMY;
    const orderRef = doc(
      db,
      ACADEMIES_COLLECTION,
      academyId,
      "orders",
      orderId
    );
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return { success: false, error: "Order not found" };
    }

    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
};

/**
 * Converts a cart order to a pending order
 * @param userId The user ID
 * @returns Object with success status, order ID, and error message if any
 */
export const convertCartOrderToPending = async (
  userId: string
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const academyId = ACADEMY;

    // Find the user's cart order
    const ordersRef = collection(db, ACADEMIES_COLLECTION, academyId, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId),
      where("status", "==", "cart")
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, error: "No cart order found" };
    }

    // Get the cart order
    const cartOrder = snapshot.docs[0];
    const orderRef = doc(
      db,
      ACADEMIES_COLLECTION,
      academyId,
      "orders",
      cartOrder.id
    );

    // Update the order status to pending
    await updateDoc(orderRef, {
      status: "pending",
      updatedAt: serverTimestamp(),
    });

    return { success: true, orderId: cartOrder.id };
  } catch (error) {
    console.error("Error converting cart order to pending:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to convert cart order to pending",
    };
  }
};

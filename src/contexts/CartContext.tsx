import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Course } from '../lib/courses';
import { createOrUpdateCartOrder } from '../lib/orders';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, QuerySnapshot, DocumentData, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

const ACADEMIES_COLLECTION = import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || 'agaacademies';
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

// Use Course type directly instead of an empty extending interface
type CartItem = Course;

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string; user?: User | null }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: { items: CartItem[], total: number } };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  loadCartFromFirebase: (userId: string) => Promise<boolean>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      if (state.items.some(item => item.id === action.payload.id)) {
        return state;
      }
      return {
        items: [...state.items, action.payload],
        total: state.total + action.payload.price
      };
    case 'REMOVE_ITEM': {
      const item = state.items.find(item => item.id === action.payload);
      
      // Create the new state
      const newState = {
        items: state.items.filter(item => item.id !== action.payload),
        total: state.total - (item?.price || 0)
      };
      
      // Update localStorage with the new cart state
      localStorage.setItem('cart', JSON.stringify(newState));
      
      // Get the current cart order ID from localStorage
      const cartOrderId = localStorage.getItem('cartOrderId');
      
      // If we have a cart order ID, update the Firebase order
      if (cartOrderId) {
        // Update the order in Firebase
        const orderRef = doc(db, ACADEMIES_COLLECTION, ACADEMY, 'orders', cartOrderId);
        
        // Create a new items array without the removed item
        const updatedItems = newState.items.map(item => ({
          courseId: item.id,
          title: item.title,
          price: item.price
        }));
        
        // Update the order document
        updateDoc(orderRef, {
          items: updatedItems,
          total: newState.total,
          updatedAt: new Date()
        }).then(() => {
          console.log('Successfully updated cart order in Firebase');
        }).catch(error => {
          console.error('Error updating cart in Firebase:', error);
        });
      }
      
      return newState;
    }
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    case 'SET_CART':
      return action.payload;
    default:
      return state;
  }
};

// Define an interface for order items
interface OrderItem {
  courseId?: string;
  id?: string;
  title?: string;
  price?: number;
  description?: string;
  instructor?: string;
  slug?: string;
  thumbnail?: string;
  duration?: string;
  enrolledCount?: number;
  category?: string;
  level?: string;
  aboutCourse?: string;
  learningObjectives?: string;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
}

/**
 * CartProvider - Primary cart state management for the application
 * 
 * Note: This application uses two cart state implementations:
 * 1. This Context-based implementation (primary, used throughout the app)
 * 2. A Redux-based implementation (secondary, used mainly in the payment return flow)
 * 
 * The Return.tsx component synchronizes both implementations when needed.
 * This provider also keeps the Redux store in sync with the Context state.
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with empty cart
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const { user } = useAuth();

  // Function to load cart from Firebase order with status 'cart'
  const loadCartFromFirebase = async (userId: string) => {
    try {
      console.log('Attempting to load cart from Firebase for user:', userId);
      
      // Query for orders with status 'cart' for the current user
      const ordersRef = collection(db, ACADEMIES_COLLECTION, ACADEMY, 'orders');
      
      try {
        // First attempt with the full query including ordering
        const q = query(
          ordersRef,
          where('userId', '==', userId),
          where('status', '==', 'cart'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        console.log('Snapshot:', snapshot, userId);
        
        if (snapshot.empty) {
          console.log('No cart orders found for user:', userId);
          return false;
        }
        
        // Process the results
        return processCartOrderSnapshot(snapshot);
        
      } catch (indexError) {
        // If we get an index error, try a simpler query without ordering
        console.warn('Index error occurred, trying simpler query:', indexError);
        console.warn('Please create the required index using this link:', 
          `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/firestore/indexes`);
        console.warn('You need to create a composite index on collection "orders" with fields:');
        console.warn('- userId (Ascending)');
        console.warn('- status (Ascending)');
        console.warn('- createdAt (Descending)');
        
        // Fallback query without ordering
        const fallbackQuery = query(
          ordersRef,
          where('userId', '==', userId),
          where('status', '==', 'cart')
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        if (fallbackSnapshot.empty) {
          console.log('No cart orders found for user (fallback query):', userId);
          return false;
        }
        
        // Process the results from the fallback query
        return processCartOrderSnapshot(fallbackSnapshot);
      }
    } catch (error) {
      console.error('Error loading cart from Firebase:', error);
      return false;
    }
  };

  // Helper function to process cart order snapshot
  const processCartOrderSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    // Get the most recent cart order (or first one if no ordering)
    const cartOrder = snapshot.docs[0];
    const orderData = cartOrder.data();
    console.log('Found cart order:', orderData);
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.log('Cart order has no items');
      return false;
    }
    
    // Convert order items to cart items
    const cartItemsPromises = orderData.items.map(async (item: OrderItem) => {
      // Extract the courseId - in the order document, it's directly in the 'courseId' field
      const courseId = item.courseId;
      if (!courseId) {
        console.error('Item has no courseId:', item);
        return null;
      }
      
      try {
        // Fetch the full course details from the courses collection
        const courseDoc = await getDoc(doc(db, ACADEMIES_COLLECTION, ACADEMY, 'courses', courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          
          // Create a complete CartItem using both the order item data and the course data
          return {
            id: courseId,
            title: item.title || courseData.title || '',
            price: item.price || courseData.price || 0,
            description: courseData.description || '',
            instructor: courseData.instructor || '',
            status: courseData.status || 'published',
            slug: courseData.slug || '',
            thumbnail: courseData.thumbnail || '',
            duration: courseData.duration || '',
            enrolledCount: courseData.enrolledCount || 0,
            category: courseData.category || '',
            level: courseData.level || 'beginner',
            aboutCourse: courseData.aboutCourse || '',
            learningObjectives: courseData.learningObjectives || '',
            createdAt: courseData.createdAt ? new Date(courseData.createdAt) : new Date(),
            updatedAt: courseData.updatedAt ? new Date(courseData.updatedAt) : new Date()
          } as CartItem;
        } else {
          console.error(`Course not found for ID: ${courseId}`);
          
          // If course not found, create a minimal cart item with the data from the order
          return {
            id: courseId,
            title: item.title || `Course ${courseId}`,
            price: item.price || 0,
            description: '',
            instructor: '',
            status: 'published',
            slug: '',
            thumbnail: '',
            duration: '',
            enrolledCount: 0,
            category: '',
            level: 'beginner',
            aboutCourse: '',
            learningObjectives: '',
            createdAt: new Date(),
            updatedAt: new Date()
          } as CartItem;
        }
      } catch (error) {
        console.error(`Error fetching course ${courseId}:`, error);
        
        // In case of error, create a minimal cart item with the data from the order
        return {
          id: courseId,
          title: item.title || `Course ${courseId}`,
          price: item.price || 0,
          description: '',
          instructor: '',
          status: 'published',
          slug: '',
          thumbnail: '',
          duration: '',
          enrolledCount: 0,
          category: '',
          level: 'beginner',
          aboutCourse: '',
          learningObjectives: '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as CartItem;
      }
    });
    
    return Promise.all(cartItemsPromises)
      .then(cartItems => {
        // Filter out null items
        const validCartItems = cartItems.filter((item): item is CartItem => item !== null);
        
        if (validCartItems.length === 0) {
          console.log('No valid cart items found after processing');
          return false;
        }
        
        // Use the total from the order if available, otherwise calculate it
        const total = orderData.total || validCartItems.reduce((sum, item) => sum + item.price, 0);
        
        // Set the cart
        dispatch({ 
          type: 'SET_CART', 
          payload: { 
            items: validCartItems, 
            total 
          } 
        });
        
        console.log('Successfully loaded cart from Firebase:', validCartItems);
        return true;
      });
  };

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Clear first to avoid duplicates
        dispatch({ type: 'CLEAR_CART' });
        // Add each item individually to properly calculate the total
        if (parsedCart.items && Array.isArray(parsedCart.items)) {
          parsedCart.items.forEach((item: CartItem) => {
            dispatch({ type: 'ADD_ITEM', payload: item });
          });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    } else if (user) {
      // If cart is empty and user is logged in, try to load cart from Firebase
      loadCartFromFirebase(user.uid);
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
    
    // Create or update cart order in Firebase if user is logged in
    if (user && state.items.length > 0) {
      createOrUpdateCartOrder(
        user.uid,
        user.email || '',
        state.items,
        state.total
      ).catch(error => {
        console.error('Error creating/updating cart order:', error);
      });
    }
  }, [state, user]);

  const addItem = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id, user });
  }, [user]);

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, clearCart, loadCartFromFirebase }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CourseDetails } from '../../lib/users';

interface CartState {
  items: CourseDetails[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CourseDetails>) => {
      // Check if course is already in cart
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (!existingItem) {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setCartItems: (state, action: PayloadAction<CourseDetails[]>) => {
      state.items = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, setCartItems, clearCart } = cartSlice.actions;

export default cartSlice.reducer; 
import { configureStore } from '@reduxjs/toolkit';
import paymentReducer from './features/paymentSlice';
import cartReducer from './features/cartSlice';

export const store = configureStore({
  reducer: {
    payment: paymentReducer,
    cart: cartReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

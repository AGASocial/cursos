import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  amount: number;
  courseName: string | null;
}

const initialState: PaymentState = {
  amount: 0,
  courseName: null,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<number>) => {
      state.amount = action.payload;
    },
    setCourseName: (state, action: PayloadAction<string>) => {
      state.courseName = action.payload;
    },
  },
});

export const { setAmount, setCourseName } = paymentSlice.actions;

export const selectAmount = (state: { payment: PaymentState }) => state.payment.amount;
export const selectCourseName = (state: { payment: PaymentState }) => state.payment.courseName;

export default paymentSlice.reducer;

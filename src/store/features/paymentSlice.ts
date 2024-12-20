import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  amount: number;
}

const initialState: PaymentState = {
  amount: 0,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setAmount: (state, action: PayloadAction<number>) => {
      state.amount = action.payload;
    },
  },
});

export const { setAmount } = paymentSlice.actions;

export const selectAmount = (state: { payment: PaymentState }) => state.payment.amount;

export default paymentSlice.reducer;

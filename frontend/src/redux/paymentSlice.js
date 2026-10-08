import { createSlice } from "@reduxjs/toolkit";

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    isPaymentOpen: false,
    paymentTargetUser: null,
    defaultAmount: "",
    defaultNote: "",
  },
  reducers: {
    openPaymentModal: (state, action) => {
      state.isPaymentOpen = true;
      state.paymentTargetUser = action.payload?.targetUser || null;
      state.defaultAmount = action.payload?.amount || "";
      state.defaultNote = action.payload?.note || "";
    },
    closePaymentModal: (state) => {
      state.isPaymentOpen = false;
      state.paymentTargetUser = null;
      state.defaultAmount = "";
      state.defaultNote = "";
    },
  },
});

export const { openPaymentModal, closePaymentModal } = paymentSlice.actions;
export default paymentSlice.reducer;

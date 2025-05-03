import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import residentsReducer from './slices/residentsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    residents: residentsReducer,
    // Add other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
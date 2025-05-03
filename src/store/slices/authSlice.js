import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../../api/auth';

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ identifier, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await loginUser(identifier, password);
      
      // Store token if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Check for stored token
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { dispatch }) => {
    const token = await AsyncStorage.getItem('token');
    
    if (token) {
      // Validate token and get user info
      try {
        // This would typically verify the token with your backend
        // For now, we'll just return the token
        return { token };
      } catch (error) {
        // If token is invalid, remove it
        await AsyncStorage.removeItem('token');
        return null;
      }
    }
    
    return null;
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await AsyncStorage.removeItem('token');
    return null;
  }
);

const initialState = {
  user: null,
  token: null,
  userRole: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.userRole = action.payload.user.role;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.userRole = action.payload.user?.role;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.userRole = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
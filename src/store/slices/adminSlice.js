import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchRoles = createAsyncThunk(
  'admin/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/roles');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'admin/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/permissions');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const updateRolePermissions = createAsyncThunk(
  'admin/updateRolePermissions',
  async ({ roleId, permissions }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/roles/${roleId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role permissions');
    }
  }
);

export const updateFieldVisibility = createAsyncThunk(
  'admin/updateFieldVisibility',
  async ({ roleId, fieldVisibility }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/roles/${roleId}/field-visibility`, { fieldVisibility });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update field visibility');
    }
  }
);

export const updateFileAccess = createAsyncThunk(
  'admin/updateFileAccess',
  async ({ roleId, fileAccess }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/roles/${roleId}/file-access`, { fileAccess });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update file access');
    }
  }
);

// Initial state
const initialState = {
  roles: null,
  permissions: null,
  fieldDefinitions: null,
  fileTypes: null,
  loading: false,
  error: null,
  success: null,
};

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
        state.loading = false;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Fetch permissions
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload.permissions;
        state.fieldDefinitions = action.payload.fieldDefinitions;
        state.fileTypes = action.payload.fileTypes;
        state.loading = false;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Update role permissions
      .addCase(updateRolePermissions.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRolePermissions.fulfilled, (state, action) => {
        // Update the role in the roles array
        const updatedRole = action.payload;
        state.roles = state.roles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        );
        state.loading = false;
        state.success = 'Role permissions updated successfully';
      })
      .addCase(updateRolePermissions.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Update field visibility
      .addCase(updateFieldVisibility.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFieldVisibility.fulfilled, (state, action) => {
        // Update the role in the roles array
        const updatedRole = action.payload;
        state.roles = state.roles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        );
        state.loading = false;
        state.success = 'Field visibility updated successfully';
      })
      .addCase(updateFieldVisibility.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // Update file access
      .addCase(updateFileAccess.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateFileAccess.fulfilled, (state, action) => {
        // Update the role in the roles array
        const updatedRole = action.payload;
        state.roles = state.roles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        );
        state.loading = false;
        state.success = 'File access updated successfully';
      })
      .addCase(updateFileAccess.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { clearError, clearSuccess } = adminSlice.actions;

export default adminSlice.reducer;
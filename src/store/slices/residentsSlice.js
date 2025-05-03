import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

// Fetch all residents
export const fetchResidents = createAsyncThunk(
  'residents/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/residents', { params });
      // return response.data;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock residents data
      const mockResidents = Array(100).fill().map((_, index) => ({
        id: `res-${index + 1}`,
        name: `Resident ${index + 1}`,
        type: index % 3 === 0 ? 'owner' : 'tenant',
        idNumber: `ID${100000 + index}`,
        unitNumber: `A${Math.floor(index / 10) + 1}-${(index % 10) + 1}`,
        sector: `Sector ${Math.floor(index / 20) + 1}`,
        phone: `+966 5${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        email: `resident${index + 1}@example.com`,
        moveInDate: new Date(2020, Math.floor(index / 10) % 12, (index % 28) + 1).toISOString(),
        status: index % 10 === 0 ? 'pending' : 'active',
        documents: index % 5 === 0 ? [
          { id: `doc-${index}-1`, name: 'ID Document.pdf', type: 'application/pdf' },
          { id: `doc-${index}-2`, name: 'Contract.pdf', type: 'application/pdf' }
        ] : [],
      }));
      
      // Filter based on params
      let filteredResidents = [...mockResidents];
      
      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        filteredResidents = filteredResidents.filter(resident => 
          resident.name.toLowerCase().includes(searchLower) ||
          resident.idNumber.toLowerCase().includes(searchLower) ||
          resident.unitNumber.toLowerCase().includes(searchLower)
        );
      }
      
      if (params?.sector) {
        filteredResidents = filteredResidents.filter(resident => 
          resident.sector === params.sector
        );
      }
      
      if (params?.type) {
        filteredResidents = filteredResidents.filter(resident => 
          resident.type === params.type
        );
      }
      
      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      const paginatedResidents = filteredResidents.slice(startIndex, endIndex);
      
      return {
        residents: paginatedResidents,
        totalCount: filteredResidents.length,
        page,
        limit,
        totalPages: Math.ceil(filteredResidents.length / limit)
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Fetch resident by ID
export const fetchResidentById = createAsyncThunk(
  'residents/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // const response = await api.get(`/residents/${id}`);
      // return response.data;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = parseInt(id.split('-')[1]) - 1;
      
      return {
        id,
        name: `Resident ${index + 1}`,
        type: index % 3 === 0 ? 'owner' : 'tenant',
        idNumber: `ID${100000 + index}`,
        unitNumber: `A${Math.floor(index / 10) + 1}-${(index % 10) + 1}`,
        sector: `Sector ${Math.floor(index / 20) + 1}`,
        phone: `+966 5${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        email: `resident${index + 1}@example.com`,
        moveInDate: new Date(2020, Math.floor(index / 10) % 12, (index % 28) + 1).toISOString(),
        status: index % 10 === 0 ? 'pending' : 'active',
        documents: index % 5 === 0 ? [
          { id: `doc-${index}-1`, name: 'ID Document.pdf', type: 'application/pdf', url: 'https://example.com/doc1.pdf' },
          { id: `doc-${index}-2`, name: 'Contract.pdf', type: 'application/pdf', url: 'https://example.com/doc2.pdf' }
        ] : [],
        address: `Building A${Math.floor(index / 10) + 1}, Apartment ${(index % 10) + 1}`,
        nationality: index % 5 === 0 ? 'Saudi Arabian' : index % 5 === 1 ? 'Egyptian' : index % 5 === 2 ? 'Indian' : index % 5 === 3 ? 'Pakistani' : 'Filipino',
        emergencyContact: `+966 5${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
        notes: index % 3 === 0 ? 'VIP resident' : '',
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Create new resident
export const createResident = createAsyncThunk(
  'residents/create',
  async (residentData, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // const response = await api.post('/residents', residentData);
      // return response.data;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate required fields
      if (!residentData.name || !residentData.idNumber || !residentData.unitNumber) {
        return rejectWithValue({ message: 'Required fields are missing' });
      }
      
      // Check for duplicate ID (mock implementation)
      if (residentData.idNumber === 'ID100001') {
        return rejectWithValue({ message: 'A resident with this ID number already exists' });
      }
      
      return {
        id: `res-${Date.now()}`,
        ...residentData,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Update resident
export const updateResident = createAsyncThunk(
  'residents/update',
  async ({ id, residentData }, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // const response = await api.put(`/residents/${id}`, residentData);
      // return response.data;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate required fields
      if (!residentData.name || !residentData.idNumber || !residentData.unitNumber) {
        return rejectWithValue({ message: 'Required fields are missing' });
      }
      
      return {
        id,
        ...residentData,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Delete resident
export const deleteResident = createAsyncThunk(
  'residents/delete',
  async (id, { rejectWithValue }) => {
    try {
      // In a real app, this would be an API call
      // await api.delete(`/residents/${id}`);
      // return id;
      
      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  residents: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  limit: 50,
  currentResident: null,
  loading: false,
  error: null,
  success: false,
  filters: {
    search: '',
    sector: '',
    type: '',
  },
};

const residentsSlice = createSlice({
  name: 'residents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      state.currentPage = 1; // Reset to first page when filters change
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearCurrentResident: (state) => {
      state.currentResident = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all residents
      .addCase(fetchResidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResidents.fulfilled, (state, action) => {
        state.loading = false;
        state.residents = action.payload.residents;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.limit = action.payload.limit;
      })
      .addCase(fetchResidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch residents';
      })
      
      // Fetch resident by ID
      .addCase(fetchResidentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResidentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResident = action.payload;
      })
      .addCase(fetchResidentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch resident details';
      })
      
      // Create resident
      .addCase(createResident.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createResident.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Optionally add to list if on the first page
        if (state.currentPage === 1) {
          state.residents = [action.payload, ...state.residents.slice(0, state.limit - 1)];
        }
        state.totalCount += 1;
        state.totalPages = Math.ceil(state.totalCount / state.limit);
      })
      .addCase(createResident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create resident';
      })
      
      // Update resident
      .addCase(updateResident.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateResident.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update in the list if present
        const index = state.residents.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.residents[index] = action.payload;
        }
        // Update current resident if it's the same one
        if (state.currentResident && state.currentResident.id === action.payload.id) {
          state.currentResident = action.payload;
        }
      })
      .addCase(updateResident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update resident';
      })
      
      // Delete resident
      .addCase(deleteResident.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteResident.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Remove from the list
        state.residents = state.residents.filter(r => r.id !== action.payload);
        state.totalCount -= 1;
        state.totalPages = Math.ceil(state.totalCount / state.limit);
        // Clear current resident if it's the same one
        if (state.currentResident && state.currentResident.id === action.payload) {
          state.currentResident = null;
        }
      })
      .addCase(deleteResident.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete resident';
      });
  },
});

export const { 
  clearError, 
  clearSuccess, 
  setFilters, 
  setCurrentPage,
  clearCurrentResident
} = residentsSlice.actions;
export default residentsSlice.reducer;
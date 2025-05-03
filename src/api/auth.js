import axios from 'axios';

// Replace with your actual API URL
const API_URL = 'https://api.wesal-app.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login user
export const loginUser = async (identifier, password) => {
  try {
    // For development/testing purposes
    // In a real app, this would be an actual API call
    console.log('Login attempt with:', { identifier, password });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - replace with actual API call
    // This is just for demonstration
    const mockUsers = [
      { email: 'admin@wesal.com', phone: '1234567890', password: 'password123', role: 'admin', name: 'Admin User' },
      { email: 'manager@wesal.com', phone: '2345678901', password: 'password123', role: 'cityManager', name: 'City Manager' },
      { email: 'security@wesal.com', phone: '3456789012', password: 'password123', role: 'securityOfficer', name: 'Security Officer' },
      { email: 'resident@wesal.com', phone: '4567890123', password: 'password123', role: 'resident', name: 'Resident User' },
    ];
    
    // Check if user exists
    const user = mockUsers.find(u => 
      (u.email === identifier || u.phone === identifier) && u.password === password
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Generate mock JWT token
    const token = `mock-jwt-token-${user.role}-${Date.now()}`;
    
    return {
      token,
      user: {
        id: `user-${Date.now()}`,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
    
    // In a real app, this would be:
    // const response = await api.post('/auth/login', { identifier, password });
    // return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Add token to requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
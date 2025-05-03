import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { API_URL } from '../config/constants';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createLogger, logAuthentication, logAccessDenied } from '../utils/logger';
import { getUserPermissions } from './permissionService';
import config from '../config';

// This is a mock implementation. In a real app, you would connect to your backend API
export const loginUser = async (identifier, password) => {
  // For demo purposes, we're simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // This is where you would make an actual API call
  // const response = await fetch(`${API_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ identifier, password }),
  // });
  
  // if (!response.ok) {
  //   const error = await response.json();
  //   throw new Error(error.code || 'UNKNOWN_ERROR');
  // }
  
  // return await response.json();

  // Mock implementation for demo
  if (identifier === 'admin@wesal.com' && password === 'password') {
    return {
      token: 'mock_jwt_token_for_admin',
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@wesal.com',
        role: 'ADMIN',
      },
    };
  } else if (identifier === 'resident@wesal.com' && password === 'password') {
    return {
      token: 'mock_jwt_token_for_resident',
      user: {
        id: '2',
        name: 'Resident User',
        email: 'resident@wesal.com',
        role: 'RESIDENT',
      },
    };
  } else if (identifier === 'security@wesal.com' && password === 'password') {
    return {
      token: 'mock_jwt_token_for_security',
      user: {
        id: '3',
        name: 'Security Officer',
        email: 'security@wesal.com',
        role: 'SECURITY_OFFICER',
      },
    };
  }

  throw new Error('INVALID_CREDENTIALS');
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userInfo');
  // You might want to call your backend to invalidate the token
};

export const getUserInfo = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const logger = createLogger('auth-service');

/**
 * Generate JWT token with user information, role and permissions
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
export const generateToken = async (user) => {
  try {
    // Get user permissions
    const permissions = await getUserPermissions(user.id, user.role);
    
    // Create token payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions,
      // Add additional claims as needed for ABAC
      iat: Math.floor(Date.now() / 1000),
    };
    
    // Sign token
    const token = jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    // Log successful authentication
    logAuthentication({
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString()
    });
    
    return token;
  } catch (error) {
    logger.error('Token generation failed', { error: error.message, userId: user.id });
    throw new Error('Authentication failed');
  }
};

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} - User object and token
 */
export const authenticateUser = async (email, password) => {
  try {
    // This would typically involve database lookup
    // For demonstration purposes, we'll use a mock user
    const user = await findUserByEmail(email);
    
    if (!user) {
      logAccessDenied({
        email,
        reason: 'User not found',
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      logAccessDenied({
        userId: user.id,
        email,
        reason: 'Invalid password',
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = await generateToken(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    };
  } catch (error) {
    logger.error('Authentication failed', { error: error.message, email });
    throw error;
  }
};

/**
 * Mock function to find user by email
 * In a real application, this would query a database
 */
const findUserByEmail = async (email) => {
  // This is just a placeholder
  // In a real app, this would query your database
  return null;
};
import { api, tokenManager, userManager } from './apiClient';

// Authentication service class
class AuthService {
  constructor() {
    // Listen for auth logout events
    window.addEventListener('auth:logout', this.handleAutoLogout.bind(this));
  }

  // Handle automatic logout (e.g., token expiration)
  handleAutoLogout(event) {
    const reason = event.detail?.reason || 'unknown';
    console.log('Auto logout triggered:', reason);
    
    // You can emit this to your auth container or handle it globally
    window.dispatchEvent(new CustomEvent('auth:forceLogout', { 
      detail: { reason } 
    }));
  }

  // Sign up new user
  async signup(userData) {
    try {
      const response = await api.auth.signup(userData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        tokenManager.setToken(token);
        userManager.setUser(user);
        
        return {
          success: true,
          user,
          token,
          message: response.data.message || 'Registration successful'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  }

  // Sign in existing user
  async signin(credentials) {
    try {
      const response = await api.auth.signin(credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token and user data
        tokenManager.setToken(token);
        userManager.setUser(user);
        
        return {
          success: true,
          user,
          token,
          message: response.data.message || 'Login successful'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Signin error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.auth.getProfile();
      
      if (response.data.success) {
        const user = response.data.data.user;
        
        // Update stored user data
        userManager.setUser(user);
        
        return {
          success: true,
          user
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to get profile'
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to get profile'
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.auth.updateProfile(profileData);
      
      if (response.data.success) {
        const user = response.data.data.user;
        
        // Update stored user data
        userManager.setUser(user);
        
        return {
          success: true,
          user,
          message: response.data.message || 'Profile updated successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to update profile'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update profile'
      };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.auth.changePassword(passwordData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password changed successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to change password'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to change password'
      };
    }
  }

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await api.auth.verifyEmail(token);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Email verified successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Email verification failed'
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Email verification failed'
      };
    }
  }

  // Resend verification email
  async resendVerification(email) {
    try {
      const response = await api.auth.resendVerification(email);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Verification email sent'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to send verification email'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send verification email'
      };
    }
  }

  // Logout user
  logout() {
    // Clear all stored data
    tokenManager.clearAll();
    userManager.removeUser();
    
    // Emit logout event
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { reason: 'user_logout' } 
    }));
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = tokenManager.getToken();
    const user = userManager.getUser();
    return !!(token && user);
  }

  // Get current user from local storage
  getCurrentUser() {
    return userManager.getUser();
  }

  // Get current token
  getCurrentToken() {
    return tokenManager.getToken();
  }

  // Check if user has a specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user is patient
  isPatient() {
    return this.hasRole('patient');
  }

  // Check if user is doctor
  isDoctor() {
    return this.hasRole('doctor');
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Initialize authentication from stored data
  initializeAuth() {
    const token = tokenManager.getToken();
    const user = userManager.getUser();
    
    if (token && user) {
      return {
        success: true,
        user,
        token,
        isAuthenticated: true
      };
    }
    
    return {
      success: false,
      isAuthenticated: false
    };
  }

  // Update stored user data (helper method for AuthContainer)
  updateStoredUser(user) {
    userManager.setUser(user);
  }

  // Deactivate account
  async deactivateAccount(password) {
    try {
      const response = await api.auth.deactivateAccount(password);
      
      if (response.data.success) {
        // Clear stored data after deactivation
        this.logout();
        
        return {
          success: true,
          message: response.data.message || 'Account deactivated successfully'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Failed to deactivate account'
      };
    } catch (error) {
      console.error('Deactivate account error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to deactivate account'
      };
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
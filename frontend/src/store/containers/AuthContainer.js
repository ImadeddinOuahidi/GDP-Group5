import { useState, useEffect } from "react";
import { createContainer } from "unstated-next";
import authService from "../services/authService";

// Mock user database for demo purposes (fallback)
const MOCK_USERS = {
  patient1: { 
    _id: "demo-patient1",
    email: "patient1@example.com", 
    username: "patient1",
    password: "1234", 
    role: "patient", 
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    isActive: true,
    isEmailVerified: true
  },
  doctor1: { 
    _id: "demo-doctor1",
    email: "doctor1@example.com", 
    username: "doctor1",
    password: "abcd", 
    role: "doctor", 
    name: "Dr. Smith",
    firstName: "Dr. Jane",
    lastName: "Smith",
    isActive: true,
    isEmailVerified: true
  },
};

function useAuth(initialState = null) {
  const [user, setUser] = useState(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Normalize user object to ensure required properties
          const normalizedUser = {
            ...userData,
            name: userData.name || userData.username || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
            firstName: userData.firstName || userData.name?.split(' ')[0] || userData.username || 'User',
            lastName: userData.lastName || userData.name?.split(' ')[1] || '',
            role: userData.role || 'patient'
          };
          
          setUser(normalizedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setError("");
    
    try {
      // Determine if input is email or username for demo users
      let email = emailOrUsername;
      if (!emailOrUsername.includes('@')) {
        // It's a username, map to demo email
        const mockUser = MOCK_USERS[emailOrUsername];
        if (mockUser) {
          email = mockUser.email;
        }
      }

      // Try API call first
      try {
        const response = await authService.signin({ email, password });
        
        if (response.success) {
          const apiUser = response.user;
          
          // Normalize API user object
          const normalizedUser = {
            ...apiUser,
            name: apiUser.name || `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.username || apiUser.email,
            firstName: apiUser.firstName || apiUser.name?.split(' ')[0] || apiUser.username || 'User',
            lastName: apiUser.lastName || apiUser.name?.split(' ')[1] || '',
            role: apiUser.role || 'patient'
          };
          
          setUser(normalizedUser);
          setIsAuthenticated(true);
          
          return { success: true, user: normalizedUser };
        }
      } catch (apiError) {
        console.log("API login failed, trying demo credentials:", apiError);
        
        // Fallback to demo credentials for development
        const username = emailOrUsername.includes('@') ? 
          Object.keys(MOCK_USERS).find(key => MOCK_USERS[key].email === emailOrUsername) :
          emailOrUsername;
          
        if (username && MOCK_USERS[username] && MOCK_USERS[username].password === password) {
          const mockUser = MOCK_USERS[username];
          
          // Use the complete mock user data with normalization
          const normalizedUser = {
            ...mockUser,
            name: mockUser.name || mockUser.username,
            firstName: mockUser.firstName || mockUser.name?.split(' ')[0] || mockUser.username,
            lastName: mockUser.lastName || mockUser.name?.split(' ')[1] || '',
          };
          
          setUser(normalizedUser);
          setIsAuthenticated(true);
          
          // Save to localStorage (demo token)
          localStorage.setItem("token", `demo-token-${username}`);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
          
          return { success: true, user: normalizedUser };
        }
        
        // If both API and demo fail
        const errorMessage = apiError.message || "Invalid email/username or password";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
    } catch (err) {
      const errorMessage = "Login failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError("");
    
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const signup = async (userData) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await authService.signup(userData);
      
      if (response.success) {
        const newUser = response.user;
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, user: newUser, message: response.message };
      }
      
      setError(response.message || "Signup failed");
      return { success: false, error: response.message || "Signup failed" };
    } catch (err) {
      const errorMessage = err.message || "Signup failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.user;
        setUser(updatedUser);
        
        return { success: true, user: updatedUser, message: response.message };
      }
      
      setError(response.message || "Profile update failed");
      return { success: false, error: response.message || "Profile update failed" };
    } catch (err) {
      const errorMessage = err.message || "Profile update failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    if (user) {
      const updatedUser = { 
        ...user, 
        role: newRole,
        // Ensure name consistency
        name: user.name || user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError("");
  };

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    logout,
    signup,
    updateProfile,
    switchRole,
    clearError,
    
    // Computed values
    isPatient: user?.role === "patient",
    isDoctor: user?.role === "doctor",
    isAdmin: user?.role === "admin",
    
    // User info
    userName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    userEmail: user?.email || '',
  };
}

const AuthContainer = createContainer(useAuth);

export default AuthContainer;
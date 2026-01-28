import { useState, useEffect } from "react";
import { createContainer } from "unstated-next";
import { api } from "../../services/apiClient";

// Demo user database for demo purposes (fallback)
const MOCK_USERS = {
  "patient@demo.com": { 
    _id: "demo-patient1",
    email: "patient@demo.com", 
    password: "Demo@123", 
    role: "patient", 
    name: "Demo Patient",
    firstName: "Demo",
    lastName: "Patient",
    isActive: true,
    isEmailVerified: true
  },
  "doctor@demo.com": { 
    _id: "demo-doctor1",
    email: "doctor@demo.com", 
    password: "Demo@123", 
    role: "doctor", 
    name: "Dr. Demo",
    firstName: "Dr. Demo",
    lastName: "Doctor",
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
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");
        
        // Only auto-login if we have both user and a valid token
        if (savedUser && savedToken && !savedToken.startsWith('demo-token')) {
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
        } else {
          // Clear any invalid or demo tokens
          localStorage.removeItem("token");
          localStorage.removeItem("user");
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
      // Normalize email input (MOCK_USERS now uses email as key)
      const email = emailOrUsername.toLowerCase().trim();

      // Try API call first
      try {
        const response = await api.auth.signin({ email, password });
        
        if (response.data.success) {
          const { user: apiUser, token } = response.data.data;
          
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
          
          // Save to localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
          
          return { success: true, user: normalizedUser };
        }
      } catch (apiError) {
        console.log("API login failed:", apiError.message);
        
        // Only fallback to demo credentials if API is completely unavailable
        if (apiError.code === 'ECONNREFUSED' || apiError.message.includes('Network Error')) {
          console.log("API unavailable, trying demo credentials...");
          
          // MOCK_USERS now keyed by email
          const mockUser = MOCK_USERS[email];
            
          if (mockUser && mockUser.password === password) {
            
            // Use the complete mock user data with normalization
            const normalizedUser = {
              ...mockUser,
              name: mockUser.name || mockUser.email,
              firstName: mockUser.firstName || mockUser.name?.split(' ')[0] || 'User',
              lastName: mockUser.lastName || mockUser.name?.split(' ')[1] || '',
            };
            
            setUser(normalizedUser);
            setIsAuthenticated(true);
            
            // Save to localStorage (demo token)
            localStorage.setItem("token", `demo-token-${mockUser.role}`);
            localStorage.setItem("user", JSON.stringify(normalizedUser));
            
            return { success: true, user: normalizedUser };
          }
        }
        
        // If API rejects login, show the actual error
        const errorMessage = apiError.response?.data?.message || "Invalid email or password";
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
    
    // Clear all localStorage data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  };

  const signup = async (userData) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await api.auth.signup(userData);
      
      if (response.data.success) {
        const { user: newUser, token } = response.data.data;
        
        // Normalize user object
        const normalizedUser = {
          ...newUser,
          name: newUser.name || `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.username,
          firstName: newUser.firstName || newUser.name?.split(' ')[0] || 'User',
          lastName: newUser.lastName || newUser.name?.split(' ')[1] || '',
          role: newUser.role || 'patient'
        };
        
        setUser(normalizedUser);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        
        return { success: true, user: normalizedUser, message: response.data.message };
      }
      
      setError(response.data.message || "Signup failed");
      return { success: false, error: response.data.message || "Signup failed" };
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
      const response = await api.auth.updateProfile(profileData);
      
      if (response.data.success) {
        const updatedUserData = response.data.data.user;
        const normalizedUser = {
          ...user,
          ...updatedUserData,
          name: updatedUserData.name || `${updatedUserData.firstName || ''} ${updatedUserData.lastName || ''}`.trim() || user.name,
        };
        
        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        
        return { success: true, user: normalizedUser, message: response.data.message };
      }
      
      setError(response.data.message || "Profile update failed");
      return { success: false, error: response.data.message || "Profile update failed" };
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
export { AuthContainer };
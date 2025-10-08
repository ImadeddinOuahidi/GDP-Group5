import { useState, useEffect } from "react";
import { createContainer } from "unstated-next";
import { authAPI } from "../services/api";

// Mock user database for demo purposes (fallback)
const MOCK_USERS = {
  patient1: { email: "patient1@example.com", password: "1234", role: "patient", name: "John Doe" },
  doctor1: { email: "doctor1@example.com", password: "abcd", role: "doctor", name: "Dr. Smith" },
};

function useAuth(initialState = null) {
  const [user, setUser] = useState(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
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
        const response = await authAPI.signin(email, password);
        
        if (response.success) {
          const { user: userData, token } = response.data;
          
          setUser(userData);
          setIsAuthenticated(true);
          
          // Save to localStorage
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(userData));
          
          return { success: true, user: userData };
        }
      } catch (apiError) {
        console.log("API login failed, trying demo credentials:", apiError);
        
        // Fallback to demo credentials for development
        const username = emailOrUsername.includes('@') ? 
          Object.keys(MOCK_USERS).find(key => MOCK_USERS[key].email === emailOrUsername) :
          emailOrUsername;
          
        if (username && MOCK_USERS[username] && MOCK_USERS[username].password === password) {
          const userData = {
            _id: `demo-${username}`,
            email: MOCK_USERS[username].email,
            firstName: MOCK_USERS[username].name.split(' ')[0],
            lastName: MOCK_USERS[username].name.split(' ')[1] || '',
            role: MOCK_USERS[username].role,
            isActive: true,
            isEmailVerified: true
          };
          
          setUser(userData);
          setIsAuthenticated(true);
          
          // Save to localStorage (demo token)
          localStorage.setItem("token", `demo-token-${username}`);
          localStorage.setItem("user", JSON.stringify(userData));
          
          return { success: true, user: userData };
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
      const response = await authAPI.signup(userData);
      
      if (response.success) {
        const { user: newUser, token } = response.data;
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(newUser));
        
        return { success: true, user: newUser, message: response.message };
      }
      
      return { success: false, error: "Signup failed" };
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
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      }
      
      return { success: false, error: "Profile update failed" };
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
      const updatedUser = { ...user, role: newRole };
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
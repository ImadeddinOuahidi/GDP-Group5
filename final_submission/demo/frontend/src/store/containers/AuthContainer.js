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
  "admin@demo.com": {
    _id: "demo-admin1",
    email: "admin@demo.com",
    password: "Demo@123",
    role: "admin",
    name: "Demo Admin",
    firstName: "Demo",
    lastName: "Admin",
    isActive: true,
    isEmailVerified: true
  },
};

const VALID_ROLES = new Set(["admin", "doctor", "patient"]);

const normalizeRole = (role) => {
  const normalizedRole = String(role || "patient").trim().toLowerCase();
  return VALID_ROLES.has(normalizedRole) ? normalizedRole : "patient";
};

const normalizeUser = (userData = {}) => ({
  ...userData,
  name: userData.name || userData.username || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
  firstName: userData.firstName || userData.name?.split(' ')[0] || userData.username || 'User',
  lastName: userData.lastName || userData.name?.split(' ')[1] || '',
  role: normalizeRole(userData.role),
});

function useAuth(initialState = null) {
  const [user, setUser] = useState(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");
        
        // Only auto-login if we have both user and a valid token
        if (savedUser && savedToken && !savedToken.startsWith('demo-token')) {
          const cachedUser = normalizeUser(JSON.parse(savedUser));
          const isStaleInitialization = () => localStorage.getItem("token") !== savedToken;

          try {
            const response = await api.auth.getProfile();
            const profileUser = response?.data?.data?.user;

            // Prevent stale boot-time auth from overriding a fresh login/logout.
            if (isStaleInitialization()) {
              return;
            }

            if (response?.data?.success && profileUser) {
              const normalizedUser = normalizeUser(profileUser);
              setUser(normalizedUser);
              setIsAuthenticated(true);
              localStorage.setItem("user", JSON.stringify(normalizedUser));
              return;
            }
          } catch (profileError) {
            if (isStaleInitialization()) {
              return;
            }

            if (profileError?.response?.status === 401 || !localStorage.getItem('token')) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
              setIsAuthenticated(false);
              return;
            }
            console.warn('Failed to refresh auth profile, falling back to cached user:', profileError?.message || profileError);
          }

          if (isStaleInitialization()) {
            return;
          }

          setUser(cachedUser);
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
      const identifier = emailOrUsername.trim();
      const email = identifier.toLowerCase();

      // Try API call first
      try {
        const response = await api.auth.signin({ identifier, email, password });
        
        if (response.data.success) {
          const { user: apiUser, token } = response.data.data;
          const normalizedUser = normalizeUser(apiUser);
          
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
            
            const normalizedUser = normalizeUser(mockUser);
            
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
        const normalizedUser = normalizeUser(newUser);
        
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
        const normalizedUser = normalizeUser({
          ...user,
          ...updatedUserData,
        });
        
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
      const normalizedUser = normalizeUser(updatedUser);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
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

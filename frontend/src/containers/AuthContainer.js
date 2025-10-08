import { useState } from "react";
import { createContainer } from "unstated-next";

// Mock user database (in a real app, this would be API calls)
const MOCK_USERS = {
  patient1: { password: "1234", role: "patient", name: "John Doe" },
  doctor1: { password: "abcd", role: "doctor", name: "Dr. Smith" },
};

function useAuth(initialState = null) {
  const [user, setUser] = useState(initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize auth state from localStorage on mount
  useState(() => {
    const savedRole = localStorage.getItem("userRole");
    const savedUsername = localStorage.getItem("username");
    if (savedRole && savedUsername) {
      setUser({
        username: savedUsername,
        role: savedRole,
        name: MOCK_USERS[savedUsername]?.name || savedUsername
      });
      setIsAuthenticated(true);
    }
  });

  const login = async (username, password) => {
    setLoading(true);
    setError("");
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (MOCK_USERS[username] && MOCK_USERS[username].password === password) {
        const userData = {
          username,
          role: MOCK_USERS[username].role,
          name: MOCK_USERS[username].name
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Save to localStorage
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("username", userData.username);
        
        return { success: true, user: userData };
      } else {
        setError("Invalid username or password");
        return { success: false, error: "Invalid credentials" };
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      return { success: false, error: "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError("");
    
    // Clear localStorage
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
  };

  const switchRole = (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem("userRole", newRole);
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
    switchRole,
    clearError,
    
    // Computed values
    isPatient: user?.role === "patient",
    isDoctor: user?.role === "doctor",
  };
}

const AuthContainer = createContainer(useAuth);

export default AuthContainer;
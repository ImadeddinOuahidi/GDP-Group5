// Utility functions for validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateAge = (age) => {
  const numAge = parseInt(age);
  return numAge >= 0 && numAge <= 150;
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const rule = rules[field];
    
    if (rule.required && !validateRequired(value)) {
      errors[field] = `${field} is required`;
    } else if (value) {
      if (rule.type === 'email' && !validateEmail(value)) {
        errors[field] = 'Please enter a valid email address';
      } else if (rule.type === 'password' && !validatePassword(value)) {
        errors[field] = 'Password must be at least 6 characters long';
      } else if (rule.type === 'phone' && !validatePhone(value)) {
        errors[field] = 'Please enter a valid phone number';
      } else if (rule.type === 'age' && !validateAge(value)) {
        errors[field] = 'Please enter a valid age';
      } else if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} characters`;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
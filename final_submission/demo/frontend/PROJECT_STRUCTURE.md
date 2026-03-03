# Frontend Project Structure

This document outlines the reorganized frontend project structure for better development practices and maintainability.

## 📁 Directory Structure

```
src/
├── 📁 components/           # Reusable UI components
│   ├── 📁 common/          # Generic shared components
│   ├── 📁 forms/           # Form-specific components
│   ├── 📁 layout/          # Layout components (AppBar, Navigation, MainLayout)
│   ├── 📁 ui/              # UI-specific components (Loading, etc.)
│   └── 📄 index.js         # Barrel exports for components
├── 📁 pages/               # Page-level components
│   ├── 📁 auth/            # Authentication pages (Login, Registration)
│   ├── 📁 dashboard/       # Dashboard pages (Home, Settings, DoctorHome)
│   ├── 📁 patient/         # Patient-specific pages (Report)
│   └── 📄 index.js         # Barrel exports for pages
├── 📁 hooks/               # Custom React hooks
│   ├── 📄 useAuth.js       # Authentication hook
│   ├── 📄 useLocalStorage.js # Local storage hook
│   ├── 📄 common.js        # Common utility hooks
│   └── 📄 index.js         # Barrel exports for hooks
├── 📁 services/            # API services and external integrations
│   ├── 📄 authService.js   # Authentication service
│   ├── 📄 apiClient.js     # Axios client with interceptors
│   └── 📄 index.js         # Barrel exports for services
├── 📁 store/               # State management
│   ├── 📁 containers/      # Unstated-next containers
│   └── 📄 index.js         # Store exports
├── 📁 utils/               # Utility functions
│   ├── 📄 validation.js    # Form validation utilities
│   ├── 📄 formatters.js    # Data formatting utilities
│   ├── 📄 storage.js       # Local/session storage utilities
│   └── 📄 index.js         # Barrel exports for utilities
├── 📁 constants/           # Application constants and configurations
│   ├── 📄 constants.js     # App constants (routes, validation rules, etc.)
│   └── 📄 index.js         # Constants exports
├── 📁 styles/              # Styling and themes
│   ├── 📁 theme/           # Material-UI theme configuration
│   ├── 📄 App.css          # Global app styles
│   ├── 📄 index.css        # Root styles
│   └── 📄 *.css            # Other CSS files
├── 📁 config/              # Configuration files
│   ├── 📄 constants.js     # Application constants
│   ├── 📄 environment.js   # Environment configuration
│   └── 📄 routes.js        # Centralized routing configuration
├── 📄 App.js               # Main app component
├── 📄 index.js             # React app entry point
└── 📄 exports.js           # Main barrel export file
```

## 🎯 Key Benefits

### 1. **Separation of Concerns**
- Pages are separated from reusable components
- Business logic is isolated in services and hooks
- Utilities and helpers are centralized

### 2. **Better Scalability**
- Clear component hierarchy
- Easier to locate and modify files
- Reduced coupling between modules

### 3. **Improved Developer Experience**
- Barrel exports for cleaner imports
- Consistent file organization
- Self-documenting structure

### 4. **Maintainability**
- Centralized configuration and constants
- Standardized patterns across the codebase
- Clear dependencies and relationships

## 📋 Import Guidelines

### Use Barrel Imports
```javascript
// ✅ Good - Use barrel imports
import { Login, Registration } from '../pages';
import { CustomAppBar, Loading } from '../components';
import { useAuth, useLocalStorage } from '../hooks';

// ❌ Avoid - Direct file imports when barrel exists  
import Login from '../pages/auth/Login';
import CustomAppBar from '../components/layout/CustomAppBar';
```

### Follow Import Order
```javascript
// 1. External libraries
import React from 'react';
import { Box, Typography } from '@mui/material';

// 2. Internal imports (pages, components, etc.)
import { CustomAppBar } from '../components';
import { useAuth } from '../hooks';

// 3. Relative imports
import './styles.css';
```

## 🔧 Component Categories

### **Pages** (`src/pages/`)
- Top-level route components
- Business logic coordination
- Layout composition

### **Components** (`src/components/`)
- **Layout**: AppBar, Navigation, MainLayout
- **UI**: Loading indicators, modals, etc.
- **Common**: Shared reusable components
- **Forms**: Form-specific components

### **Hooks** (`src/hooks/`)
- Custom React hooks for state and side effects
- Reusable logic extraction
- Integration with external services

### **Services** (`src/services/`)
- API communication
- External service integration  
- Data transformation

## 🎨 Theming Structure

The theme system is located in `src/styles/theme/`:
- `theme.js`: Theme definitions (light/dark)
- `ThemeProvider.js`: Theme context and switching logic

## 🔐 Authentication Flow

Authentication is managed through:
- `src/store/containers/AuthContainer.js`: Global auth state
- `src/services/authService.js`: Auth API calls
- `src/hooks/useAuth.js`: Auth hook for components

## 🛣️ Routing

Centralized routing configuration in `src/config/routes.js`:
- Route definitions
- Protected route guards
- Public route handling
- Role-based access control

## 📦 State Management

Using unstated-next for state management:
- Containers in `src/store/containers/`
- Hooks in `src/hooks/` for easy access
- Local state for component-specific data

This structure promotes clean architecture principles and follows React best practices for scalable application development.
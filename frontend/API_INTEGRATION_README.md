# API Integration Setup Instructions

## Overview
The frontend has been updated to integrate with the backend API using axios for HTTP communication. The authentication system now supports both real API calls and demo credentials for development.

## Changes Made

### 1. API Service Layer (`src/services/api.js`)
- Created comprehensive API service with axios configuration
- Added interceptors for automatic token handling and error management
- Implemented endpoints for auth, medicines, reports, and symptom progression

### 2. Updated AuthContainer (`src/containers/AuthContainer.js`)
- Replaced mock authentication with real API calls
- Added fallback to demo credentials for development
- Enhanced user state management with proper token storage
- Added signup and profile update functionality

### 3. Updated Login Component (`src/Login.js`)
- Modified to accept email or username
- Updated demo credentials display to show emails
- Enhanced form validation and error handling

### 4. Environment Configuration (`.env`)
- Added API base URL configuration
- Set default to `http://localhost:5000/api`

## How to Test

### 1. Start Backend Server
```bash
cd backend
npm start
```
The backend should be running on `http://localhost:5000`

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start Frontend Application
```bash
npm start
```
The frontend will be available at `http://localhost:3000`

### 4. Test Login Scenarios

#### API Login (if backend is running):
- Create a user account through the backend API
- Use real email/password credentials to login

#### Demo Login (fallback):
- **Patient**: Use `patient1@example.com` or `patient1` with password `1234`
- **Doctor**: Use `doctor1@example.com` or `doctor1` with password `abcd`

## Key Features

### Automatic Fallback
The system will try API authentication first, then fall back to demo credentials if the API is unavailable.

### Token Management
- JWT tokens are automatically included in API requests
- Tokens are stored in localStorage
- Auto-logout on token expiration (401 responses)

### Error Handling
- Network errors are gracefully handled
- User-friendly error messages
- Automatic retry for transient failures

### User Experience
- Loading states during authentication
- Clear error messages
- Persistent login sessions

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## API Endpoints Available

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/search` - Search medicines
- `POST /api/medicines` - Add medicine (admin/doctor)

### Reports
- `GET /api/reports` - Get user reports
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report

### Symptom Progression
- `GET /api/symptom-progression` - Get progressions
- `POST /api/symptom-progression` - Create progression
- `GET /api/symptom-progression/analytics` - Get analytics

## Troubleshooting

### Backend Connection Issues
- Ensure backend server is running on port 5000
- Check CORS configuration in backend
- Verify API endpoints are accessible

### Authentication Issues
- Clear localStorage and cookies
- Check network tab for API response errors
- Verify user credentials in database

### Demo Mode
If API is unavailable, the system automatically uses demo credentials for development purposes.
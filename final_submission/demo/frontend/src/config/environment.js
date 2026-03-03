// Environment configuration
const config = {
  development: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    APP_NAME: 'SafeMed ADR System',
    VERSION: '1.0.0',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL,
    APP_NAME: 'SafeMed ADR System',
    VERSION: '1.0.0',
    DEBUG: false,
  },
  test: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    APP_NAME: 'SafeMed ADR System - Test',
    VERSION: '1.0.0',
    DEBUG: true,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];
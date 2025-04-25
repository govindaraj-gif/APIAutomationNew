// import axios from 'axios';

// // Get the API URL from environment or default to current server
// const API_URL = process.env.REACT_APP_API_URL || '';
// console.log('Using API URL:', API_URL);

// // For direct API call testing - use the Replit URL instead of localhost
// const API_TEST_URL = window.location.origin;
// console.log('Using API URL:', API_TEST_URL);

// // Define a third option - the backend API directly
// const DIRECT_API_URL = 'http://localhost:8080';
// console.log('Using API URL:', DIRECT_API_URL);

// // Create an array of URLs to try in order
// const API_URLS = [
//   '/api', // Proxy URL
//   `${API_TEST_URL}/api`, // Direct from origin
//   `${DIRECT_API_URL}/api`, // Direct backend
//   'http://localhost:8080/api', // Explicit localhost
//   window.location.href.includes('replit') ? 
//     `https://${window.location.hostname}/api` : null, // Explicit Replit URL
// ].filter(Boolean); // Remove any null entries

// console.log('Auth service trying these URLs:', API_URLS);

// /**
//  * Try all API URLs until one works
//  * @param {string} method - HTTP method (get, post, etc.)
//  * @param {string} endpoint - API endpoint (e.g., '/login')
//  * @param {object} data - Optional data for POST requests
//  * @param {boolean} returnNullOn401 - If true, return null on 401 unauthorized
//  * @returns {Promise<any>} - Response data or null
//  */
// const tryAllUrls = async (method, endpoint, data = null, returnNullOn401 = false) => {
//   let lastError = null;
  
//   for (const baseUrl of API_URLS) {
//     const url = `${baseUrl}${endpoint}`;
//     console.log(`Trying ${method.toUpperCase()} request to: ${url}`);
    
//     try {
//       const config = {
//         withCredentials: true, // Important for cookies
//       };
      
//       let response;
//       if (method.toLowerCase() === 'get') {
//         response = await axios.get(url, config);
//       } else {
//         response = await axios.post(url, data, config);
//       }
      
//       console.log(`Success from ${url}:`, response.status);
//       return response.data;
//     } catch (error) {
//       console.log(`Failed request to ${url}:`, error.message);
      
//       // If 401 and we're configured to return null, do so
//       if (returnNullOn401 && error.response && error.response.status === 401) {
//         console.log('Returning null for 401 response');
//         return null;
//       }
      
//       // Store the error but continue to next URL
//       lastError = error;
//     }
//   }
  
//   // If we've tried all URLs and all failed, throw the last error
//   console.error('All API URLs failed');
//   throw lastError;
// };

// /**
//  * Authentication Service
//  * Handles API calls related to user authentication (login, register, logout)
//  */
// const authService = {
//   // Get the currently logged-in user
//   getCurrentUser: async () => {
//     try {
//       return await tryAllUrls('get', '/user', null, true);
//     } catch (error) {
//       console.error('Error fetching current user:', error);
//       throw error;
//     }
//   },
  
//   // Login with email and password
//   login: async (credentials) => {
//     try {
//       console.log('Sending login request with credentials:', {
//         email: credentials.email,
//         passwordLength: credentials.password ? credentials.password.length : 0
//       });
      
//       return await tryAllUrls('post', '/login', credentials);
//     } catch (error) {
//       console.error('Login error:', error);
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         console.error('Error response:', error.response.data);
//         console.error('Error status:', error.response.status);
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error('No response received:', error.request);
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error('Error setting up request:', error.message);
//       }
//       throw error;
//     }
//   },
  
//   // Register a new user
//   register: async (userData) => {
//     try {
//       return await tryAllUrls('post', '/register', userData);
//     } catch (error) {
//       console.error('Registration error:', error);
//       throw error;
//     }
//   },
  
//   // Logout the current user
//   logout: async () => {
//     try {
//       await tryAllUrls('post', '/logout');
//       return true;
//     } catch (error) {
//       console.error('Logout error:', error);
//       throw error;
//     }
//   },
  
//   // Direct login with explicit URL (for troubleshooting)
//   directLogin: async (url, credentials) => {
//     console.log(`Direct login attempt to ${url}/api/login`);
//     try {
//       const response = await axios.post(`${url}/api/login`, credentials, {
//         withCredentials: true,
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Direct login error:', error);
//       throw error;
//     }
//   }
// };

// export default authService;